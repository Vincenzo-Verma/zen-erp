//! REST → gRPC bridge for the Audit service.

use axum::extract::{Path, Query};
use axum::Json;
use erp_proto::audit::audit_service_client::AuditServiceClient;
use erp_proto::audit::ListEventsRequest;
use http::StatusCode;
use serde::{Deserialize, Serialize};

fn audit_addr() -> String {
    std::env::var("TENANCY_SERVICE_ADDR")
        .unwrap_or_else(|_| "http://127.0.0.1:50053".to_string())
}

#[derive(Deserialize)]
pub struct ListAuditQuery {
    pub action: Option<String>,
    pub resource_type: Option<String>,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}

#[derive(Serialize)]
pub struct AuditEventBody {
    pub id: String,
    pub tenant_id: String,
    pub user_id: String,
    pub user_email: String,
    pub action: String,
    pub resource_type: String,
    pub resource_id: String,
    pub details_json: String,
    pub ip_address: String,
    pub created_at: String,
}

/// GET /api/v1/audit/:tenant_id
pub async fn list_audit_events_handler(
    Path(tenant_id): Path<String>,
    Query(q): Query<ListAuditQuery>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let mut client = AuditServiceClient::connect(audit_addr())
        .await
        .map_err(|e| {
            (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(serde_json::json!({"success": false, "message": format!("Audit service unavailable: {e}")})),
            )
        })?;

    let response = client
        .list_events(ListEventsRequest {
            tenant_id,
            action_filter: q.action.unwrap_or_default(),
            resource_type_filter: q.resource_type.unwrap_or_default(),
            limit: q.limit.unwrap_or(50),
            offset: q.offset.unwrap_or(0),
        })
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"success": false, "message": format!("gRPC error: {e}")})),
            )
        })?;

    let resp = response.into_inner();

    let events: Vec<AuditEventBody> = resp
        .events
        .into_iter()
        .map(|e| AuditEventBody {
            id: e.id,
            tenant_id: e.tenant_id,
            user_id: e.user_id,
            user_email: e.user_email,
            action: e.action,
            resource_type: e.resource_type,
            resource_id: e.resource_id,
            details_json: e.details_json,
            ip_address: e.ip_address,
            created_at: e.created_at,
        })
        .collect();

    Ok(Json(serde_json::json!({
        "events": events,
        "total_count": resp.total_count,
    })))
}
