//! gRPC TenancyService implementation.

use erp_proto::tenancy::tenancy_service_server::TenancyService;
use erp_proto::tenancy::{
    AddUserToTenantRequest, CreateTenantRequest, GetTenantBySlugRequest, GetTenantRequest,
    GetUserRoleRequest, GetUserRoleResponse, ListTenantsRequest, ListTenantsResponse,
    ListRolesRequest, ListRolesResponse, Role,
    ListTenantUsersRequest, ListTenantUsersResponse, TenantUser,
    ListPluginsRequest, ListPluginsResponse, PluginInfo,
    PluginActionRequest, PluginActionResponse,
    UpdateTenantDomainRequest, UpdateTenantPrefixRequest,
    Tenant, TenantResponse, TenantUserResponse,
};
use sqlx::PgPool;
use tonic::{Request, Response, Status};
use uuid::Uuid;

/// Tenancy service backed by Postgres.
pub struct TenancyServiceImpl {
    pool: PgPool,
}

impl TenancyServiceImpl {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Create system roles for a new tenant and return the admin role ID.
    async fn create_system_roles(
        &self,
        tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
        tenant_id: Uuid,
    ) -> Result<Uuid, Status> {
        let system_roles = [
            ("admin", "Full access to all resources"),
            ("teacher", "Staff member — attendance, grades"),
            ("student", "Student — read-only access to own data"),
            ("parent", "Parent — view child records"),
            ("accountant", "Fee and billing management"),
            ("receptionist", "Front office manager — admissions"),
        ];

        let mut admin_role_id = Uuid::nil();

        for (name, desc) in &system_roles {
            let role_id = Uuid::new_v4();
            sqlx::query(
                "INSERT INTO roles (id, tenant_id, name, description, is_system) \
                 VALUES ($1, $2, $3, $4, true)"
            )
            .bind(role_id)
            .bind(tenant_id)
            .bind(name)
            .bind(desc)
            .execute(&mut **tx)
            .await
            .map_err(|e| Status::internal(format!("Role insert error: {e}")))?;

            if *name == "admin" {
                admin_role_id = role_id;

                // Grant all permissions to admin role
                sqlx::query(
                    "INSERT INTO role_permissions (role_id, permission_id) \
                     SELECT $1, id FROM permissions"
                )
                .bind(role_id)
                .execute(&mut **tx)
                .await
                .map_err(|e| Status::internal(format!("Admin perm grant error: {e}")))?;
            }
        }

        Ok(admin_role_id)
    }
}

#[tonic::async_trait]
impl TenancyService for TenancyServiceImpl {
    /// Create a new tenant (school) and assign owner as admin.
    async fn create_tenant(
        &self,
        request: Request<CreateTenantRequest>,
    ) -> Result<Response<TenantResponse>, Status> {
        let req = request.into_inner();

        if req.name.is_empty() || req.slug.is_empty() {
            return Ok(Response::new(TenantResponse {
                success: false,
                message: "Name and slug are required".into(),
                tenant: None,
                suggestions: vec![],
            }));
        }

        // Check slug uniqueness
        let slug_taken = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM tenants WHERE slug = $1",
        )
        .bind(&req.slug)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("DB error: {e}")))?
        > 0;

        // Check name uniqueness
        let name_taken = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM tenants WHERE LOWER(name) = LOWER($1)",
        )
        .bind(&req.name)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("DB error: {e}")))?
        > 0;

        if slug_taken || name_taken {
            // Generate up to 3 available slug suggestions
            let base_slug = req.slug.trim_end_matches(|c: char| c == '-' || c.is_ascii_digit());
            let mut suggestions: Vec<String> = Vec::new();
            let mut candidate = 2i32;
            while suggestions.len() < 3 && candidate < 100 {
                let try_slug = format!("{}-{}", base_slug, candidate);
                let exists = sqlx::query_scalar::<_, i64>(
                    "SELECT COUNT(*) FROM tenants WHERE slug = $1",
                )
                .bind(&try_slug)
                .fetch_one(&self.pool)
                .await
                .map_err(|e| Status::internal(format!("DB error: {e}")))?;
                if exists == 0 {
                    suggestions.push(try_slug);
                }
                candidate += 1;
            }

            let msg = if name_taken && slug_taken {
                format!("An organization with the name '{}' already exists", req.name)
            } else if slug_taken {
                format!("The slug '{}' is already taken", req.slug)
            } else {
                format!("An organization with the name '{}' already exists", req.name)
            };

            return Ok(Response::new(TenantResponse {
                success: false,
                message: msg,
                tenant: None,
                suggestions,
            }));
        }

        let tenant_id = Uuid::new_v4();
        let now = chrono::Utc::now();
        let tenant_type = if req.r#type.is_empty() { "school".to_string() } else { req.r#type.clone() };
        let domain: Option<&str> = if req.domain.is_empty() { None } else { Some(&req.domain) };

        // Begin transaction — create tenant + wallet + roles + assign owner
        let mut tx = self.pool.begin().await
            .map_err(|e| Status::internal(format!("TX begin error: {e}")))?;

        // Insert tenant
        sqlx::query(
            "INSERT INTO tenants (id, name, slug, type, domain, status, plan_tier, created_at, updated_at) \
             VALUES ($1, $2, $3, $4, $5, 'active', 'basic', $6, $6)"
        )
        .bind(tenant_id)
        .bind(&req.name)
        .bind(&req.slug)
        .bind(&tenant_type)
        .bind(domain)
        .bind(now)
        .execute(&mut *tx)
        .await
        .map_err(|e| Status::internal(format!("Tenant insert error: {e}")))?;

        // Set RLS context so subsequent inserts into tenant-scoped tables pass
        sqlx::query(&format!("SET LOCAL app.current_tenant = '{}'", tenant_id))
            .execute(&mut *tx)
            .await
            .map_err(|e| Status::internal(format!("RLS context error: {e}")))?;

        // Create wallet with zero balance
        sqlx::query(
            "INSERT INTO wallets (tenant_id, balance, currency, updated_at) VALUES ($1, 0.00, 'USD', $2)"
        )
        .bind(tenant_id)
        .bind(now)
        .execute(&mut *tx)
        .await
        .map_err(|e| Status::internal(format!("Wallet insert error: {e}")))?;

        // Create system roles (admin, teacher, student, parent, accountant)
        let admin_role_id = self.create_system_roles(&mut tx, tenant_id).await?;

        // Assign owner as admin (if owner_user_id provided)
        if !req.owner_user_id.is_empty() {
            let owner_id: Uuid = req.owner_user_id.parse()
                .map_err(|_| Status::invalid_argument("Invalid owner_user_id UUID"))?;

            sqlx::query(
                "INSERT INTO tenant_users (tenant_id, user_id, role_id) VALUES ($1, $2, $3)"
            )
            .bind(tenant_id)
            .bind(owner_id)
            .bind(admin_role_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| Status::internal(format!("Tenant-user insert error: {e}")))?;
        }

        tx.commit().await
            .map_err(|e| Status::internal(format!("TX commit error: {e}")))?;

        tracing::info!(tenant_id = %tenant_id, slug = %req.slug, "Tenant created");

        Ok(Response::new(TenantResponse {
            success: true,
            message: "Tenant created successfully".into(),
            tenant: Some(Tenant {
                id: tenant_id.to_string(),
                name: req.name,
                slug: req.slug,
                status: "active".into(),
                plan_tier: "basic".into(),
                created_at: now.to_rfc3339(),
                r#type: tenant_type,
                domain: domain.unwrap_or("").to_string(),
                prefix: String::new(),
            }),
            suggestions: vec![],
        }))
    }

    /// Get tenant by ID.
    async fn get_tenant(
        &self,
        request: Request<GetTenantRequest>,
    ) -> Result<Response<TenantResponse>, Status> {
        let req = request.into_inner();
        let tenant_id: Uuid = req.tenant_id.parse()
            .map_err(|_| Status::invalid_argument("Invalid tenant_id UUID"))?;

        let row = sqlx::query_as::<_, (Uuid, String, String, String, String, chrono::DateTime<chrono::Utc>, String, Option<String>, Option<String>)>(
            "SELECT id, name, slug, status, plan_tier, created_at, type, domain, prefix FROM tenants WHERE id = $1"
        )
        .bind(tenant_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("DB error: {e}")))?;

        match row {
            Some((id, name, slug, status, plan_tier, created_at, t, d, p)) => {
                Ok(Response::new(TenantResponse {
                    success: true,
                    message: "Tenant found".into(),
                    tenant: Some(Tenant {
                        id: id.to_string(),
                        name,
                        slug,
                        status,
                        plan_tier,
                        created_at: created_at.to_rfc3339(),
                        r#type: t,
                        domain: d.unwrap_or_default(),
                        prefix: p.unwrap_or_default(),
                    }),
                    suggestions: vec![],
                }))
            }
            None => Ok(Response::new(TenantResponse {
                success: false,
                message: "Tenant not found".into(),
                tenant: None,
                suggestions: vec![],
            })),
        }
    }

    /// List tenants for a user.
    async fn list_tenants(
        &self,
        request: Request<ListTenantsRequest>,
    ) -> Result<Response<ListTenantsResponse>, Status> {
        let req = request.into_inner();
        let user_id: Uuid = req.user_id.parse()
            .map_err(|_| Status::invalid_argument("Invalid user_id UUID"))?;

        let rows = sqlx::query_as::<_, (Uuid, String, String, String, String, chrono::DateTime<chrono::Utc>, String, Option<String>, Option<String>)>(
            "SELECT t.id, t.name, t.slug, t.status, t.plan_tier, t.created_at, t.type, t.domain, t.prefix \
             FROM tenants t \
             INNER JOIN tenant_users tu ON t.id = tu.tenant_id \
             WHERE tu.user_id = $1 \
             ORDER BY t.created_at DESC"
        )
        .bind(user_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("DB error: {e}")))?;

        let tenants: Vec<Tenant> = rows.into_iter().map(|(id, name, slug, status, plan_tier, created_at, t, d, p)| {
            Tenant {
                id: id.to_string(),
                name,
                slug,
                status,
                plan_tier,
                created_at: created_at.to_rfc3339(),
                r#type: t,
                domain: d.unwrap_or_default(),
                prefix: p.unwrap_or_default(),
            }
        }).collect();

        Ok(Response::new(ListTenantsResponse { tenants }))
    }

    /// Add user to a tenant with a role.
    async fn add_user_to_tenant(
        &self,
        request: Request<AddUserToTenantRequest>,
    ) -> Result<Response<TenantUserResponse>, Status> {
        let req = request.into_inner();
        let tenant_id: Uuid = req.tenant_id.parse()
            .map_err(|_| Status::invalid_argument("Invalid tenant_id UUID"))?;
        let user_id: Uuid = req.user_id.parse()
            .map_err(|_| Status::invalid_argument("Invalid user_id UUID"))?;

        let role_name = if req.role.is_empty() { "student" } else { &req.role };

        // Look up role_id by name within this tenant
        let role_id: Uuid = sqlx::query_scalar(
            "SELECT id FROM roles WHERE tenant_id = $1 AND name = $2"
        )
        .bind(tenant_id)
        .bind(role_name)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("DB error: {e}")))?
        .ok_or_else(|| Status::not_found(format!("Role '{}' not found in this tenant", role_name)))?;

        sqlx::query(
            "INSERT INTO tenant_users (tenant_id, user_id, role_id) VALUES ($1, $2, $3) \
             ON CONFLICT (tenant_id, user_id) DO UPDATE SET role_id = $3"
        )
        .bind(tenant_id)
        .bind(user_id)
        .bind(role_id)
        .execute(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("DB error: {e}")))?;

        tracing::info!(tenant_id = %tenant_id, user_id = %user_id, role = %role_name, "User added to tenant");

        Ok(Response::new(TenantUserResponse {
            success: true,
            message: format!("User assigned role '{}' in tenant", role_name),
        }))
    }

    /// Get tenant by slug.
    async fn get_tenant_by_slug(
        &self,
        request: Request<GetTenantBySlugRequest>,
    ) -> Result<Response<TenantResponse>, Status> {
        let req = request.into_inner();

        let row = sqlx::query_as::<_, (Uuid, String, String, String, String, chrono::DateTime<chrono::Utc>, String, Option<String>, Option<String>)>(
            "SELECT id, name, slug, status, plan_tier, created_at, type, domain, prefix FROM tenants WHERE slug = $1"
        )
        .bind(&req.slug)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("DB error: {e}")))?;

        match row {
            Some((id, name, slug, status, plan_tier, created_at, t, d, p)) => {
                Ok(Response::new(TenantResponse {
                    success: true,
                    message: "Tenant found".into(),
                    tenant: Some(Tenant {
                        id: id.to_string(),
                        name,
                        slug,
                        status,
                        plan_tier,
                        created_at: created_at.to_rfc3339(),
                        r#type: t,
                        domain: d.unwrap_or_default(),
                        prefix: p.unwrap_or_default(),
                    }),
                    suggestions: vec![],
                }))
            }
            None => Ok(Response::new(TenantResponse {
                success: false,
                message: "School not found".into(),
                tenant: None,
                suggestions: vec![],
            })),
        }
    }

    /// Get a user's role within a specific tenant.
    async fn get_user_role(
        &self,
        request: Request<GetUserRoleRequest>,
    ) -> Result<Response<GetUserRoleResponse>, Status> {
        let req = request.into_inner();
        let tenant_id: Uuid = req.tenant_id.parse()
            .map_err(|_| Status::invalid_argument("Invalid tenant_id UUID"))?;
        let user_id: Uuid = req.user_id.parse()
            .map_err(|_| Status::invalid_argument("Invalid user_id UUID"))?;

        let row = sqlx::query_as::<_, (String,)>(
            "SELECT r.name FROM tenant_users tu \
             JOIN roles r ON tu.role_id = r.id \
             WHERE tu.tenant_id = $1 AND tu.user_id = $2"
        )
        .bind(tenant_id)
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("DB error: {e}")))?;

        match row {
            Some((role_name,)) => {
                Ok(Response::new(GetUserRoleResponse {
                    found: true,
                    role: role_name,
                    tenant_id: tenant_id.to_string(),
                }))
            }
            None => {
                Ok(Response::new(GetUserRoleResponse {
                    found: false,
                    role: String::new(),
                    tenant_id: tenant_id.to_string(),
                }))
            }
        }
    }

    /// List all roles for a tenant.
    async fn list_roles(
        &self,
        request: Request<ListRolesRequest>,
    ) -> Result<Response<ListRolesResponse>, Status> {
        let req = request.into_inner();
        let tenant_id: Uuid = req.tenant_id.parse()
            .map_err(|_| Status::invalid_argument("Invalid tenant_id UUID"))?;

        let rows = sqlx::query_as::<_, (Uuid, String, String, bool)>(
            "SELECT id, name, description, is_system FROM roles WHERE tenant_id = $1 ORDER BY is_system DESC, name ASC"
        )
        .bind(tenant_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("DB error: {e}")))?;

        let roles = rows.into_iter().map(|(id, name, desc, is_system)| Role {
            id: id.to_string(),
            name,
            description: desc,
            is_system,
        }).collect();

        Ok(Response::new(ListRolesResponse { roles }))
    }

    /// List all users in a tenant with their roles.
    async fn list_tenant_users(
        &self,
        request: Request<ListTenantUsersRequest>,
    ) -> Result<Response<ListTenantUsersResponse>, Status> {
        let req = request.into_inner();
        let tenant_id: Uuid = req.tenant_id.parse()
            .map_err(|_| Status::invalid_argument("Invalid tenant_id UUID"))?;

        let rows = sqlx::query_as::<_, (Uuid, String, String, String, Uuid)>(
            "SELECT tu.user_id, u.email, u.full_name, r.name, tu.role_id \
             FROM tenant_users tu \
             JOIN users u ON tu.user_id = u.id \
             JOIN roles r ON tu.role_id = r.id \
             WHERE tu.tenant_id = $1 \
             ORDER BY r.name ASC, u.full_name ASC"
        )
        .bind(tenant_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("DB error: {e}")))?;

        let users = rows.into_iter().map(|(uid, email, full_name, role_name, role_id)| TenantUser {
            user_id: uid.to_string(),
            email,
            full_name,
            role_name,
            role_id: role_id.to_string(),
        }).collect();

        Ok(Response::new(ListTenantUsersResponse { users }))
    }

    /// List available plugins (from plugins table) with tenant activation status.
    async fn list_plugins(
        &self,
        request: Request<ListPluginsRequest>,
    ) -> Result<Response<ListPluginsResponse>, Status> {
        let req = request.into_inner();
        let tenant_id: Uuid = req.tenant_id.parse()
            .map_err(|_| Status::invalid_argument("Invalid tenant_id UUID"))?;

        let rows = sqlx::query_as::<_, (Uuid, String, String, String, String, bool, bool)>(
            "SELECT p.id, p.slug, p.name, p.description, p.version, \
             (tp.tenant_id IS NOT NULL) AS is_active, \
             (pp.plugin_id IS NOT NULL) AS is_included \
             FROM plugins p \
             LEFT JOIN tenant_plugins tp ON p.id = tp.plugin_id AND tp.tenant_id = $1 \
             LEFT JOIN plan_plugins pp ON p.id = pp.plugin_id AND pp.plan_tier = ( \
                SELECT plan_tier FROM tenants WHERE id = $1 \
             ) \
             ORDER BY p.name ASC"
        )
        .bind(tenant_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("DB error: {e}")))?;

        let plugins = rows.into_iter().map(|(id, slug, name, desc, version, is_active, is_included)| PluginInfo {
            id: id.to_string(),
            slug,
            name,
            description: desc,
            version,
            is_active_for_tenant: is_active,
            is_included_in_plan: is_included,
        }).collect();

        Ok(Response::new(ListPluginsResponse { plugins }))
    }

    /// Activate a plugin for a tenant.
    async fn activate_plugin(
        &self,
        request: Request<PluginActionRequest>,
    ) -> Result<Response<PluginActionResponse>, Status> {
        let req = request.into_inner();
        let tenant_id: Uuid = req.tenant_id.parse()
            .map_err(|_| Status::invalid_argument("Invalid tenant_id UUID"))?;
        let plugin_id: Uuid = req.plugin_id.parse()
            .map_err(|_| Status::invalid_argument("Invalid plugin_id UUID"))?;

        sqlx::query(
            "INSERT INTO tenant_plugins (tenant_id, plugin_id) VALUES ($1, $2) \
             ON CONFLICT DO NOTHING"
        )
        .bind(tenant_id)
        .bind(plugin_id)
        .execute(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("DB error: {e}")))?;

        tracing::info!(tenant_id = %tenant_id, plugin_id = %plugin_id, "Plugin activated");

        Ok(Response::new(PluginActionResponse {
            success: true,
            message: "Plugin activated".into(),
        }))
    }

    /// Deactivate a plugin for a tenant.
    async fn deactivate_plugin(
        &self,
        request: Request<PluginActionRequest>,
    ) -> Result<Response<PluginActionResponse>, Status> {
        let req = request.into_inner();
        let tenant_id: Uuid = req.tenant_id.parse()
            .map_err(|_| Status::invalid_argument("Invalid tenant_id UUID"))?;
        let plugin_id: Uuid = req.plugin_id.parse()
            .map_err(|_| Status::invalid_argument("Invalid plugin_id UUID"))?;

        sqlx::query(
            "DELETE FROM tenant_plugins WHERE tenant_id = $1 AND plugin_id = $2"
        )
        .bind(tenant_id)
        .bind(plugin_id)
        .execute(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("DB error: {e}")))?;

        tracing::info!(tenant_id = %tenant_id, plugin_id = %plugin_id, "Plugin deactivated");

        Ok(Response::new(PluginActionResponse {
            success: true,
            message: "Plugin deactivated".into(),
        }))
    }

    /// Update a tenant's custom domain.
    async fn update_tenant_domain(
        &self,
        request: Request<UpdateTenantDomainRequest>,
    ) -> Result<Response<TenantResponse>, Status> {
        let req = request.into_inner();
        let tenant_id: Uuid = req.tenant_id.parse()
            .map_err(|_| Status::invalid_argument("Invalid tenant_id UUID"))?;

        let domain: Option<&str> = if req.domain.is_empty() { None } else { Some(&req.domain) };

        sqlx::query("UPDATE tenants SET domain = $1, updated_at = now() WHERE id = $2")
            .bind(domain)
            .bind(tenant_id)
            .execute(&self.pool)
            .await
            .map_err(|e| Status::internal(format!("Update domain error: {e}")))?;

        // Fetch and return updated tenant
        let row = sqlx::query_as::<_, (Uuid, String, String, String, String, chrono::DateTime<chrono::Utc>, String, Option<String>, Option<String>)>(
            "SELECT id, name, slug, status, plan_tier, created_at, type, domain, prefix FROM tenants WHERE id = $1"
        )
        .bind(tenant_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("DB error: {e}")))?;

        match row {
            Some((id, name, slug, status, plan_tier, created_at, t, d, p)) => {
                Ok(Response::new(TenantResponse {
                    success: true,
                    message: "Domain updated".into(),
                    tenant: Some(Tenant {
                        id: id.to_string(),
                        name,
                        slug,
                        status,
                        plan_tier,
                        created_at: created_at.to_rfc3339(),
                        r#type: t,
                        domain: d.unwrap_or_default(),
                        prefix: p.unwrap_or_default(),
                    }),
                    suggestions: vec![],
                }))
            }
            None => Err(Status::not_found("Tenant not found")),
        }
    }

    /// Update a tenant's prefix for numbering.
    async fn update_tenant_prefix(
        &self,
        request: Request<UpdateTenantPrefixRequest>,
    ) -> Result<Response<TenantResponse>, Status> {
        let req = request.into_inner();
        let tenant_id: Uuid = req.tenant_id.parse()
            .map_err(|_| Status::invalid_argument("Invalid tenant_id UUID"))?;

        let prefix: Option<&str> = if req.prefix.is_empty() { None } else { Some(&req.prefix) };

        sqlx::query("UPDATE tenants SET prefix = $1, updated_at = now() WHERE id = $2")
            .bind(prefix)
            .bind(tenant_id)
            .execute(&self.pool)
            .await
            .map_err(|e| Status::internal(format!("Update prefix error: {e}")))?;

        // Fetch and return updated tenant
        let row = sqlx::query_as::<_, (Uuid, String, String, String, String, chrono::DateTime<chrono::Utc>, String, Option<String>, Option<String>)>(
            "SELECT id, name, slug, status, plan_tier, created_at, type, domain, prefix FROM tenants WHERE id = $1"
        )
        .bind(tenant_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("DB error: {e}")))?;

        match row {
            Some((id, name, slug, status, plan_tier, created_at, t, d, p)) => {
                Ok(Response::new(TenantResponse {
                    success: true,
                    message: "Prefix updated".into(),
                    tenant: Some(Tenant {
                        id: id.to_string(),
                        name,
                        slug,
                        status,
                        plan_tier,
                        created_at: created_at.to_rfc3339(),
                        r#type: t,
                        domain: d.unwrap_or_default(),
                        prefix: p.unwrap_or_default(),
                    }),
                    suggestions: vec![],
                }))
            }
            None => Err(Status::not_found("Tenant not found")),
        }
    }
}
