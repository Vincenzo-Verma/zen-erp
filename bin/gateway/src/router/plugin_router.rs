//! Dynamic router: /api/<plugin>/... → http://<plugin>-service/<...>
//! Forwards request with X-Tenant-ID and returns plugin response.

use axum::{
    body::Body,
    extract::{Request, State},
    response::Response,
};
use http::{header::CONTENT_TYPE, StatusCode};
use reqwest::Client;

/// Map API path prefix to internal K8s service DNS name.
fn plugin_service_host(plugin: &str) -> Option<String> {
    match plugin {
        "finance" => Some("finance-service".to_string()),
        "school" => Some("school-service".to_string()),
        "hr" => Some("hr-service".to_string()),
        "inventory" => Some("inventory-service".to_string()),
        _ => None,
    }
}

#[derive(Clone)]
pub struct RouterState {
    pub client: Client,
}

impl Default for RouterState {
    fn default() -> Self {
        RouterState {
            client: Client::builder()
                .timeout(std::time::Duration::from_secs(30))
                .build()
                .expect("reqwest client"),
        }
    }
}

/// Route: /api/<plugin>/<path> → http://<plugin>-service/<path>
/// Tenant is already set in headers by middleware (X-Tenant-ID).
pub async fn plugin_router(
    State(state): State<RouterState>,
    req: Request,
) -> Result<Response, (StatusCode, String)> {
    let path = req.uri().path();
    let path = path.strip_prefix("/api/").unwrap_or(path);
    let parts: Vec<&str> = path.splitn(2, '/').collect();
    let (plugin, rest) = match parts.as_slice() {
        [p, r] => (*p, *r),
        [p] => (*p, ""),
        _ => return Err((StatusCode::BAD_REQUEST, "Invalid path".into())),
    };

    let host = plugin_service_host(plugin)
        .ok_or_else(|| (StatusCode::NOT_FOUND, format!("Unknown plugin: {}", plugin)))?;

    let path = if rest.is_empty() {
        "/".to_string()
    } else {
        format!("/{}", rest)
    };
    let query = req
        .uri()
        .query()
        .map(|q| format!("?{}", q))
        .unwrap_or_default();
    let target_url = format!("http://{}:80{}{}", host, path, query);

    let method = req.method().clone();
    let headers = req.headers().clone();
    let body = axum::body::to_bytes(req.into_body(), usize::MAX)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut proxy_req = state.client.request(method, &target_url).body(body);
    for (k, v) in headers.iter() {
        if k != "host" && k != "connection" {
            if let Ok(s) = v.to_str() {
                proxy_req = proxy_req.header(k.as_str(), s);
            }
        }
    }

    let resp = proxy_req
        .send()
        .await
        .map_err(|e| (StatusCode::BAD_GATEWAY, e.to_string()))?;

    let status = resp.status();
    let resp_headers = resp.headers().clone();
    let body = resp
        .bytes()
        .await
        .map_err(|e| (StatusCode::BAD_GATEWAY, e.to_string()))?;

    let mut response = Response::new(Body::from(body));
    *response.status_mut() = status;
    if let Some(ct) = resp_headers.get(CONTENT_TYPE) {
        response.headers_mut().insert(CONTENT_TYPE, ct.clone());
    }
    Ok(response)
}
