//! REST → gRPC bridge for the Auth service.
//! Maps REST endpoints to gRPC AuthService calls.

use axum::Json;
use erp_proto::auth::auth_service_client::AuthServiceClient;
use erp_proto::auth::{LoginRequest, RegisterRequest, VerifyTokenRequest};
use http::StatusCode;
use serde::{Deserialize, Serialize};

use crate::audit_helper::record_audit_async;

fn auth_addr() -> String {
    std::env::var("AUTH_SERVICE_ADDR")
        .unwrap_or_else(|_| "http://127.0.0.1:50052".to_string())
}

#[derive(Deserialize)]
pub struct RegisterBody {
    pub email: String,
    pub password: String,
    pub full_name: Option<String>,
}

#[derive(Deserialize)]
pub struct LoginBody {
    pub email: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct AuthResponseBody {
    pub success: bool,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub token: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user_id: Option<String>,
}

/// POST /api/v1/auth/register
pub async fn register_handler(
    Json(body): Json<RegisterBody>,
) -> Result<Json<AuthResponseBody>, (StatusCode, Json<serde_json::Value>)> {
    let mut client = AuthServiceClient::connect(auth_addr())
        .await
        .map_err(|e| (StatusCode::SERVICE_UNAVAILABLE, Json(serde_json::json!({"success": false, "message": format!("Auth service unavailable: {}", e)}))))?;

    let email = body.email.clone();
    let response = client
        .register(RegisterRequest {
            email: body.email,
            password: body.password,
            full_name: body.full_name.unwrap_or_default(),
        })
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"success": false, "message": format!("gRPC error: {}", e)}))))?;

    let resp = response.into_inner();
    if resp.success && !resp.user_id.is_empty() {
        record_audit_async(
            String::new(),
            resp.user_id.clone(),
            email.clone(),
            "USER_REGISTERED",
            "auth",
            resp.user_id.clone(),
            serde_json::json!({"email": email}).to_string(),
        );
    }
    Ok(Json(AuthResponseBody {
        success: resp.success,
        message: resp.message,
        token: if resp.token.is_empty() { None } else { Some(resp.token) },
        user_id: if resp.user_id.is_empty() { None } else { Some(resp.user_id) },
    }))
}

/// POST /api/v1/auth/login
pub async fn login_handler(
    Json(body): Json<LoginBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    // 1. Authenticate to get token
    let mut auth_client = AuthServiceClient::connect(auth_addr())
        .await
        .map_err(|e| (StatusCode::SERVICE_UNAVAILABLE, Json(serde_json::json!({"success": false, "message": format!("Auth service unavailable: {}", e)}))))?;

    let response = auth_client
        .login(LoginRequest {
            email: body.email.clone(),
            password: body.password,
        })
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"success": false, "message": format!("gRPC error: {}", e)}))))?;

    let auth_resp = response.into_inner();

    if !auth_resp.success || auth_resp.token.is_empty() {
        return Ok(Json(serde_json::json!({
            "success": false,
            "message": auth_resp.message,
        })));
    }

    let token = auth_resp.token;
    let user_id = auth_resp.user_id;

    // 2. Determine Platform roles (superadmin)
    let verify_resp = auth_client
        .verify_token(VerifyTokenRequest { token: token.clone() })
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"success": false, "message": format!("Auth verify error: {e}")}))))?
        .into_inner();

    if verify_resp.roles.contains(&"superadmin".to_string()) {
        return Ok(Json(serde_json::json!({
            "success": true,
            "message": "Login successful",
            "token": token,
            "user_id": user_id,
            "role": "superadmin",
            "redirect": "/admin/tenants"
        })));
    }

    // 3. Fetch user's tenants (schools) -- graceful fallback if tenancy unavailable
    let tenancy_addr = std::env::var("TENANCY_SERVICE_ADDR")
        .unwrap_or_else(|_| "http://127.0.0.1:50053".into());

    let tenancy_result: Result<
        (erp_proto::tenancy::tenancy_service_client::TenancyServiceClient<tonic::transport::Channel>, erp_proto::tenancy::ListTenantsResponse),
        Box<dyn std::error::Error + Send + Sync>,
    > = async {
        let mut client =
            erp_proto::tenancy::tenancy_service_client::TenancyServiceClient::connect(tenancy_addr).await?;
        let resp = client
            .list_tenants(erp_proto::tenancy::ListTenantsRequest {
                user_id: user_id.clone(),
            })
            .await?
            .into_inner();
        Ok((client, resp))
    }
    .await;

    let (mut tenancy_client, tenants_resp) = match tenancy_result {
        Ok(pair) => pair,
        Err(_) => {
            // Tenancy service unavailable -- return basic auth success
            return Ok(Json(serde_json::json!({
                "success": true,
                "message": "Login successful",
                "token": token,
                "user_id": user_id,
                "redirect": "/schools"
            })));
        }
    };

    let num_tenants = tenants_resp.tenants.len();

    if num_tenants == 0 {
        return Ok(Json(serde_json::json!({
            "success": true,
            "message": "Login successful",
            "token": token,
            "user_id": user_id,
            "redirect": "/schools"
        })));
    } else if num_tenants > 1 {
        // Multi-tenant user goes to selector
        return Ok(Json(serde_json::json!({
            "success": true,
            "message": "Login successful",
            "token": token,
            "user_id": user_id,
            "redirect": "/schools"
        })));
    }

    // Exactly 1 tenant
    let tenant = &tenants_resp.tenants[0];

    // 4. Determine role within the single tenant
    let role_resp = tenancy_client
        .get_user_role(erp_proto::tenancy::GetUserRoleRequest {
            tenant_id: tenant.id.clone(),
            user_id: user_id.clone(),
        })
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"success": false, "message": format!("Role lookup error: {e}")}))))?
        .into_inner();

    if !role_resp.found {
         return Ok(Json(serde_json::json!({
            "success": false,
            "message": format!("Role not found in '{}'", tenant.name),
        })));
    }

    let portal = match role_resp.role.as_str() {
        "admin" => "admin",
        "teacher" | "receptionist" | "accountant" => "staff",
        "student" | "parent" => "student",
        _ => "student",
    };

    // 5. Audit: record login event
    record_audit_async(
        tenant.id.clone(),
        user_id.clone(),
        body.email.clone(),
        "LOGIN",
        "auth",
        String::new(),
        serde_json::json!({"role": role_resp.role}).to_string(),
    );

    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Login successful",
        "token": token,
        "user_id": user_id,
        "school": {
            "id": tenant.id,
            "name": tenant.name,
            "slug": tenant.slug,
            "status": tenant.status,
        },
        "role": role_resp.role,
        "portal": portal,
        "redirect": format!("/school/{}/portal", tenant.slug),
    })))
}

/// POST /api/v1/auth/verify (for debugging/testing)
pub async fn verify_handler(
    Json(body): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let token = body["token"].as_str().unwrap_or_default().to_string();

    let mut client = AuthServiceClient::connect(auth_addr())
        .await
        .map_err(|e| (StatusCode::SERVICE_UNAVAILABLE, Json(serde_json::json!({"success": false, "message": format!("Auth service unavailable: {}", e)}))))?;

    let response = client
        .verify_token(VerifyTokenRequest { token })
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"success": false, "message": format!("gRPC error: {}", e)}))))?;

    let resp = response.into_inner();
    Ok(Json(serde_json::json!({
        "valid": resp.valid,
        "user_id": resp.user_id,
        "email": resp.email,
        "roles": resp.roles,
    })))
}

// ── School-scoped login ──

/// POST /api/v1/auth/login/school/:slug
///
/// Composite endpoint: authenticate + resolve school + get role.
/// Returns token, user info, school info, and role for redirect.
pub async fn school_login_handler(
    axum::extract::Path(slug): axum::extract::Path<String>,
    Json(body): Json<LoginBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    // 1. Authenticate via auth service
    let mut auth_client = AuthServiceClient::connect(auth_addr())
        .await
        .map_err(|e| (StatusCode::SERVICE_UNAVAILABLE, Json(serde_json::json!({"success": false, "message": format!("Auth service unavailable: {e}")}))))?;

    let auth_resp = auth_client
        .login(LoginRequest {
            email: body.email.clone(),
            password: body.password,
        })
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"success": false, "message": format!("Auth error: {e}")}))))?
        .into_inner();

    if !auth_resp.success {
        return Ok(Json(serde_json::json!({
            "success": false,
            "message": auth_resp.message,
        })));
    }

    // 2. Resolve school by slug
    let tenancy_addr = std::env::var("TENANCY_SERVICE_ADDR")
        .unwrap_or_else(|_| "http://127.0.0.1:50053".into());

    let mut tenancy_client =
        erp_proto::tenancy::tenancy_service_client::TenancyServiceClient::connect(tenancy_addr)
            .await
            .map_err(|e| (StatusCode::SERVICE_UNAVAILABLE, Json(serde_json::json!({"success": false, "message": format!("Tenancy service unavailable: {e}")}))))?;

    let tenant_resp = tenancy_client
        .get_tenant_by_slug(erp_proto::tenancy::GetTenantBySlugRequest { slug: slug.clone() })
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"success": false, "message": format!("Tenancy error: {e}")}))))?
        .into_inner();

    let tenant = match tenant_resp.tenant {
        Some(t) => t,
        None => {
            return Ok(Json(serde_json::json!({
                "success": false,
                "message": format!("School '{}' not found", slug),
            })));
        }
    };

    // 3. Get user's role in this school
    let role_resp = tenancy_client
        .get_user_role(erp_proto::tenancy::GetUserRoleRequest {
            tenant_id: tenant.id.clone(),
            user_id: auth_resp.user_id.clone(),
        })
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"success": false, "message": format!("Role lookup error: {e}")}))))?
        .into_inner();

    if !role_resp.found {
        return Ok(Json(serde_json::json!({
            "success": false,
            "message": format!("You are not a member of '{}'", tenant.name),
        })));
    }

    // 4. Determine redirect portal
    let portal = match role_resp.role.as_str() {
        "admin" => "admin",
        "teacher" | "receptionist" | "accountant" => "staff",
        "student" | "parent" => "student",
        _ => "student",
    };

    // 5. Audit: record school login event
    record_audit_async(
        tenant.id.clone(),
        auth_resp.user_id.clone(),
        body.email.clone(),
        "LOGIN",
        "auth",
        String::new(),
        serde_json::json!({"role": role_resp.role, "school": tenant.slug}).to_string(),
    );

    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Login successful",
        "token": auth_resp.token,
        "user_id": auth_resp.user_id,
        "school": {
            "id": tenant.id,
            "name": tenant.name,
            "slug": tenant.slug,
            "status": tenant.status,
        },
        "role": role_resp.role,
        "portal": portal,
        "redirect": format!("/school/{}/portal", tenant.slug),
    })))
}
