//! gRPC health check endpoint.
//! The gateway can call the health-check gRPC service to verify connectivity.

use axum::Json;
use erp_proto::health::health_service_client::HealthServiceClient;
use erp_proto::health::HealthCheckRequest;
use serde_json::Value;

/// GET /health/grpc — calls the health-check gRPC service.
pub async fn check_grpc_health() -> Result<Json<Value>, (http::StatusCode, String)> {
    let health_addr = std::env::var("HEALTH_CHECK_ADDR")
        .unwrap_or_else(|_| "http://127.0.0.1:50051".to_string());

    let mut client = HealthServiceClient::connect(health_addr)
        .await
        .map_err(|e| {
            (
                http::StatusCode::SERVICE_UNAVAILABLE,
                format!("gRPC connect error: {}", e),
            )
        })?;

    let response = client
        .check(HealthCheckRequest {
            service: "health-check".to_string(),
        })
        .await
        .map_err(|e| {
            (
                http::StatusCode::SERVICE_UNAVAILABLE,
                format!("gRPC call error: {}", e),
            )
        })?;

    let resp = response.into_inner();
    Ok(Json(serde_json::json!({
        "grpc_status": resp.status,
        "service_name": resp.service_name,
        "version": resp.version,
    })))
}
