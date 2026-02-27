//! REST → gRPC bridge for the Tenancy service.

use axum::Json;
use erp_proto::tenancy::tenancy_service_client::TenancyServiceClient;
use erp_proto::tenancy::{
    AddUserToTenantRequest, CreateTenantRequest, GetTenantRequest, ListTenantsRequest,
    ListRolesRequest, ListTenantUsersRequest,
    ListPluginsRequest, PluginActionRequest,
    UpdateTenantDomainRequest, UpdateTenantPrefixRequest,
};
use http::StatusCode;
use serde::{Deserialize, Serialize};

use crate::audit_helper::record_audit_async;

/// Build a JSON error response so the frontend can parse error messages.
fn json_err(status: StatusCode, msg: String) -> (StatusCode, Json<serde_json::Value>) {
    (status, Json(serde_json::json!({"success": false, "message": msg})))
}

fn tenancy_addr() -> String {
    std::env::var("TENANCY_SERVICE_ADDR")
        .unwrap_or_else(|_| "http://127.0.0.1:50053".to_string())
}

#[derive(Deserialize)]
pub struct CreateTenantBody {
    pub name: String,
    pub slug: String,
    pub owner_user_id: String,
    #[serde(default = "default_school")]
    pub r#type: String,
    #[serde(default)]
    pub domain: String,
}

fn default_school() -> String { "school".into() }

#[derive(Serialize)]
pub struct TenantBody {
    pub id: String,
    pub name: String,
    pub slug: String,
    pub status: String,
    pub plan_tier: String,
    pub created_at: String,
    pub r#type: String,
    pub domain: String,
    pub prefix: String,
}

#[derive(Serialize)]
pub struct TenantResponseBody {
    pub success: bool,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tenant: Option<TenantBody>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub suggestions: Vec<String>,
}

/// POST /api/v1/tenants
pub async fn create_tenant_handler(
    Json(body): Json<CreateTenantBody>,
) -> Result<Json<TenantResponseBody>, (StatusCode, Json<serde_json::Value>)> {
    let mut client = TenancyServiceClient::connect(tenancy_addr())
        .await
        .map_err(|e| json_err(StatusCode::SERVICE_UNAVAILABLE, format!("Tenancy service unavailable: {}", e)))?;

    let response = client
        .create_tenant(CreateTenantRequest {
            name: body.name,
            slug: body.slug,
            owner_user_id: body.owner_user_id,
            r#type: body.r#type,
            domain: body.domain,
        })
        .await
        .map_err(|e| json_err(StatusCode::INTERNAL_SERVER_ERROR, format!("gRPC error: {}", e)))?;

    let resp = response.into_inner();
    Ok(Json(TenantResponseBody {
        success: resp.success,
        message: resp.message,
        tenant: resp.tenant.map(|t| TenantBody {
            id: t.id,
            name: t.name,
            slug: t.slug,
            status: t.status,
            plan_tier: t.plan_tier,
            created_at: t.created_at,
            r#type: t.r#type,
            domain: t.domain,
            prefix: t.prefix,
        }),
        suggestions: resp.suggestions,
    }))
}

/// GET /api/v1/tenants/:id
pub async fn get_tenant_handler(
    axum::extract::Path(tenant_id): axum::extract::Path<String>,
) -> Result<Json<TenantResponseBody>, (StatusCode, Json<serde_json::Value>)> {
    let mut client = TenancyServiceClient::connect(tenancy_addr())
        .await
        .map_err(|e| json_err(StatusCode::SERVICE_UNAVAILABLE, format!("Tenancy service unavailable: {}", e)))?;

    let response = client
        .get_tenant(GetTenantRequest { tenant_id })
        .await
        .map_err(|e| json_err(StatusCode::INTERNAL_SERVER_ERROR, format!("gRPC error: {}", e)))?;

    let resp = response.into_inner();
    Ok(Json(TenantResponseBody {
        success: resp.success,
        message: resp.message,
        tenant: resp.tenant.map(|t| TenantBody {
            id: t.id,
            name: t.name,
            slug: t.slug,
            status: t.status,
            plan_tier: t.plan_tier,
            created_at: t.created_at,
            r#type: t.r#type,
            domain: t.domain,
            prefix: t.prefix,
        }),
        suggestions: vec![],
    }))
}

/// GET /api/v1/tenants/user/:user_id
pub async fn list_tenants_handler(
    axum::extract::Path(user_id): axum::extract::Path<String>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let mut client = TenancyServiceClient::connect(tenancy_addr())
        .await
        .map_err(|e| json_err(StatusCode::SERVICE_UNAVAILABLE, format!("Tenancy service unavailable: {}", e)))?;

    let response = client
        .list_tenants(ListTenantsRequest { user_id })
        .await
        .map_err(|e| json_err(StatusCode::INTERNAL_SERVER_ERROR, format!("gRPC error: {}", e)))?;

    let resp = response.into_inner();
    let tenants: Vec<TenantBody> = resp.tenants.into_iter().map(|t| TenantBody {
        id: t.id,
        name: t.name,
        slug: t.slug,
        status: t.status,
        plan_tier: t.plan_tier,
        created_at: t.created_at,
        r#type: t.r#type,
        domain: t.domain,
        prefix: t.prefix,
    }).collect();

    Ok(Json(serde_json::json!({ "tenants": tenants })))
}

#[derive(Deserialize)]
pub struct AddUserBody {
    pub user_id: String,
    pub role: String,
}

/// POST /api/v1/tenants/:id/users
pub async fn add_user_to_tenant_handler(
    axum::extract::Path(tenant_id): axum::extract::Path<String>,
    Json(body): Json<AddUserBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let mut client = TenancyServiceClient::connect(tenancy_addr())
        .await
        .map_err(|e| json_err(StatusCode::SERVICE_UNAVAILABLE, format!("Tenancy service unavailable: {}", e)))?;

    let tid = tenant_id.clone();
    let uid = body.user_id.clone();
    let role_name = body.role.clone();

    let response = client
        .add_user_to_tenant(AddUserToTenantRequest {
            tenant_id,
            user_id: body.user_id,
            role: body.role,
        })
        .await
        .map_err(|e| json_err(StatusCode::INTERNAL_SERVER_ERROR, format!("gRPC error: {}", e)))?;

    let resp = response.into_inner();
    if resp.success {
        record_audit_async(
            tid,
            uid.clone(),
            String::new(),
            "ROLE_ASSIGNED",
            "role",
            uid,
            serde_json::json!({"role": role_name}).to_string(),
        );
    }
    Ok(Json(serde_json::json!({
        "success": resp.success,
        "message": resp.message,
    })))
}

/// GET /api/v1/tenants/:id/roles
pub async fn list_roles_handler(
    axum::extract::Path(tenant_id): axum::extract::Path<String>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let mut client = TenancyServiceClient::connect(tenancy_addr())
        .await
        .map_err(|e| json_err(StatusCode::SERVICE_UNAVAILABLE, format!("Tenancy service unavailable: {e}")))?;

    let resp = client
        .list_roles(ListRolesRequest { tenant_id })
        .await
        .map_err(|e| json_err(StatusCode::INTERNAL_SERVER_ERROR, format!("gRPC error: {e}")))?
        .into_inner();

    let roles: Vec<serde_json::Value> = resp.roles.into_iter().map(|r| {
        serde_json::json!({
            "id": r.id,
            "name": r.name,
            "description": r.description,
            "is_system": r.is_system,
        })
    }).collect();

    Ok(Json(serde_json::json!({ "roles": roles })))
}

/// GET /api/v1/tenants/:id/users-with-roles
pub async fn list_tenant_users_handler(
    axum::extract::Path(tenant_id): axum::extract::Path<String>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let mut client = TenancyServiceClient::connect(tenancy_addr())
        .await
        .map_err(|e| json_err(StatusCode::SERVICE_UNAVAILABLE, format!("Tenancy service unavailable: {e}")))?;

    let resp = client
        .list_tenant_users(ListTenantUsersRequest { tenant_id })
        .await
        .map_err(|e| json_err(StatusCode::INTERNAL_SERVER_ERROR, format!("gRPC error: {e}")))?
        .into_inner();

    let users: Vec<serde_json::Value> = resp.users.into_iter().map(|u| {
        serde_json::json!({
            "user_id": u.user_id,
            "email": u.email,
            "full_name": u.full_name,
            "role_name": u.role_name,
            "role_id": u.role_id,
        })
    }).collect();

    Ok(Json(serde_json::json!({ "users": users })))
}

/// GET /api/v1/tenants/:id/plugins
pub async fn list_plugins_handler(
    axum::extract::Path(tenant_id): axum::extract::Path<String>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let mut client = TenancyServiceClient::connect(tenancy_addr())
        .await
        .map_err(|e| json_err(StatusCode::SERVICE_UNAVAILABLE, format!("Tenancy service unavailable: {e}")))?;

    let resp = client
        .list_plugins(ListPluginsRequest { tenant_id })
        .await
        .map_err(|e| json_err(StatusCode::INTERNAL_SERVER_ERROR, format!("gRPC error: {e}")))?
        .into_inner();

    let plugins: Vec<serde_json::Value> = resp.plugins.into_iter().map(|p| {
        serde_json::json!({
            "id": p.id,
            "slug": p.slug,
            "name": p.name,
            "description": p.description,
            "version": p.version,
            "is_active": p.is_active_for_tenant,
            "is_included_in_plan": p.is_included_in_plan,
        })
    }).collect();

    Ok(Json(serde_json::json!({ "plugins": plugins })))
}

#[derive(Deserialize)]
pub struct PluginActionBody {
    pub plugin_id: String,
}

/// POST /api/v1/tenants/:id/plugins/activate
pub async fn activate_plugin_handler(
    axum::extract::Path(tenant_id): axum::extract::Path<String>,
    Json(body): Json<PluginActionBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let mut client = TenancyServiceClient::connect(tenancy_addr())
        .await
        .map_err(|e| json_err(StatusCode::SERVICE_UNAVAILABLE, format!("Tenancy service unavailable: {e}")))?;

    let tid = tenant_id.clone();
    let pid = body.plugin_id.clone();

    let resp = client
        .activate_plugin(PluginActionRequest { tenant_id, plugin_id: body.plugin_id })
        .await
        .map_err(|e| json_err(StatusCode::INTERNAL_SERVER_ERROR, format!("gRPC error: {e}")))?
        .into_inner();

    if resp.success {
        record_audit_async(tid, String::new(), String::new(), "PLUGIN_ACTIVATED", "plugin", pid, String::new());
    }

    Ok(Json(serde_json::json!({ "success": resp.success, "message": resp.message })))
}

/// POST /api/v1/tenants/:id/plugins/deactivate
pub async fn deactivate_plugin_handler(
    axum::extract::Path(tenant_id): axum::extract::Path<String>,
    Json(body): Json<PluginActionBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let mut client = TenancyServiceClient::connect(tenancy_addr())
        .await
        .map_err(|e| json_err(StatusCode::SERVICE_UNAVAILABLE, format!("Tenancy service unavailable: {e}")))?;

    let tid = tenant_id.clone();
    let pid = body.plugin_id.clone();

    let resp = client
        .deactivate_plugin(PluginActionRequest { tenant_id, plugin_id: body.plugin_id })
        .await
        .map_err(|e| json_err(StatusCode::INTERNAL_SERVER_ERROR, format!("gRPC error: {e}")))?
        .into_inner();

    if resp.success {
        record_audit_async(tid, String::new(), String::new(), "PLUGIN_DEACTIVATED", "plugin", pid, String::new());
    }

    Ok(Json(serde_json::json!({ "success": resp.success, "message": resp.message })))
}

#[derive(Deserialize)]
pub struct UpdateDomainBody {
    pub domain: String,
}

/// PUT /api/v1/tenants/:id/domain
pub async fn update_domain_handler(
    axum::extract::Path(tenant_id): axum::extract::Path<String>,
    Json(body): Json<UpdateDomainBody>,
) -> Result<Json<TenantResponseBody>, (StatusCode, Json<serde_json::Value>)> {
    let mut client = TenancyServiceClient::connect(tenancy_addr())
        .await
        .map_err(|e| json_err(StatusCode::SERVICE_UNAVAILABLE, format!("Tenancy service unavailable: {e}")))?;

    let resp = client
        .update_tenant_domain(UpdateTenantDomainRequest {
            tenant_id,
            domain: body.domain,
        })
        .await
        .map_err(|e| json_err(StatusCode::INTERNAL_SERVER_ERROR, format!("gRPC error: {e}")))?
        .into_inner();

    Ok(Json(TenantResponseBody {
        success: resp.success,
        message: resp.message,
        tenant: resp.tenant.map(|t| TenantBody {
            id: t.id,
            name: t.name,
            slug: t.slug,
            status: t.status,
            plan_tier: t.plan_tier,
            created_at: t.created_at,
            r#type: t.r#type,
            domain: t.domain,
            prefix: t.prefix,
        }),
        suggestions: vec![],
    }))
}

#[derive(Deserialize)]
pub struct UpdatePrefixBody {
    pub prefix: String,
}

/// PUT /api/v1/tenants/:id/prefix
pub async fn update_prefix_handler(
    axum::extract::Path(tenant_id): axum::extract::Path<String>,
    Json(body): Json<UpdatePrefixBody>,
) -> Result<Json<TenantResponseBody>, (StatusCode, Json<serde_json::Value>)> {
    let mut client = TenancyServiceClient::connect(tenancy_addr())
        .await
        .map_err(|e| json_err(StatusCode::SERVICE_UNAVAILABLE, format!("Tenancy service unavailable: {e}")))?;

    let resp = client
        .update_tenant_prefix(UpdateTenantPrefixRequest {
            tenant_id,
            prefix: body.prefix,
        })
        .await
        .map_err(|e| json_err(StatusCode::INTERNAL_SERVER_ERROR, format!("gRPC error: {e}")))?
        .into_inner();

    Ok(Json(TenantResponseBody {
        success: resp.success,
        message: resp.message,
        tenant: resp.tenant.map(|t| TenantBody {
            id: t.id,
            name: t.name,
            slug: t.slug,
            status: t.status,
            plan_tier: t.plan_tier,
            created_at: t.created_at,
            r#type: t.r#type,
            domain: t.domain,
            prefix: t.prefix,
        }),
        suggestions: vec![],
    }))
}
