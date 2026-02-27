//! Fire-and-forget audit event recording helper.
//!
//! Uses `tokio::spawn` so the calling handler doesn't block on audit writes.

use erp_proto::audit::audit_service_client::AuditServiceClient;
use erp_proto::audit::RecordEventRequest;

fn audit_addr() -> String {
    // Audit service lives inside the tenancy gRPC server on the same port
    std::env::var("TENANCY_SERVICE_ADDR")
        .unwrap_or_else(|_| "http://127.0.0.1:50053".to_string())
}

/// Record an audit event asynchronously (fire-and-forget).
pub fn record_audit_async(
    tenant_id: String,
    user_id: String,
    user_email: String,
    action: &str,
    resource_type: &str,
    resource_id: String,
    details_json: String,
) {
    let action = action.to_string();
    let resource_type = resource_type.to_string();

    tokio::spawn(async move {
        let addr = audit_addr();
        let mut client = match AuditServiceClient::connect(addr).await {
            Ok(c) => c,
            Err(e) => {
                tracing::warn!("Audit service connect failed: {e}");
                return;
            }
        };

        if let Err(e) = client
            .record_event(RecordEventRequest {
                tenant_id,
                user_id,
                user_email,
                action,
                resource_type,
                resource_id,
                details_json,
                ip_address: String::new(),
            })
            .await
        {
            tracing::warn!("Audit record_event failed: {e}");
        }
    });
}
