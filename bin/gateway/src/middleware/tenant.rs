//! Tenant identification: subdomain or X-Tenant-ID header.
//! Injects tenant context into request extensions for the router.

use axum::{
    extract::Request,
    http::header::{HeaderName, HeaderValue},
    middleware::Next,
    response::Response,
};

pub const TENANT_HEADER: &str = "X-Tenant-ID";

/// Tenant context attached to the request (and forwarded to plugins).
#[derive(Clone, Debug)]
pub struct TenantContext {
    pub tenant_id: String,
}

/// Resolves tenant from (in order):
/// 1. `X-Tenant-ID` request header
/// 2. Subdomain (e.g. `acme.saas-erp.com` → `acme`)
/// 3. Default for local/dev
pub async fn resolve_tenant(mut req: Request, next: Next) -> Response {
    let tenant_id = req
        .headers()
        .get(TENANT_HEADER)
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string())
        .or_else(|| req.uri().host().and_then(extract_subdomain))
        .unwrap_or_else(|| "default".to_string());

    req.extensions_mut().insert(TenantContext {
        tenant_id: tenant_id.clone(),
    });

    // Ensure downstream (and proxy) always see X-Tenant-ID
    req.headers_mut().insert(
        HeaderName::from_static("x-tenant-id"),
        HeaderValue::try_from(tenant_id.as_str())
            .unwrap_or(HeaderValue::from_static("default")),
    );

    next.run(req).await
}

fn extract_subdomain(host: &str) -> Option<String> {
    let parts: Vec<&str> = host.split('.').collect();
    if parts.len() >= 2 {
        let sub = parts[0];
        if !sub.is_empty() && sub != "www" {
            return Some(sub.to_string());
        }
    }
    None
}

/// Axum middleware entry: resolve tenant and call next.
pub async fn tenant_middleware(req: Request, next: Next) -> Response {
    resolve_tenant(req, next).await
}
