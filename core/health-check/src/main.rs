//! Health Check gRPC Service
//!
//! A minimal Tonic server that proves the "Walking Skeleton" gRPC path works.
//! The Gateway calls this service via `GET /health/grpc`.

use erp_proto::health::health_service_server::{HealthService, HealthServiceServer};
use erp_proto::health::{
    health_check_response::ServingStatus, HealthCheckRequest, HealthCheckResponse,
};
use tonic::{transport::Server, Request, Response, Status};

/// The health-check service implementation.
#[derive(Debug, Default)]
pub struct HealthServiceImpl;

#[tonic::async_trait]
impl HealthService for HealthServiceImpl {
    async fn check(
        &self,
        request: Request<HealthCheckRequest>,
    ) -> Result<Response<HealthCheckResponse>, Status> {
        let req = request.into_inner();
        tracing::info!(service = %req.service, "Health check requested");

        let response = HealthCheckResponse {
            status: ServingStatus::Serving.into(),
            service_name: "health-check".to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
        };

        Ok(Response::new(response))
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();
    erp_logger::init_tracing("health-check");

    let port: u16 = std::env::var("HEALTH_CHECK_PORT")
        .unwrap_or_else(|_| "50051".to_string())
        .parse()
        .expect("HEALTH_CHECK_PORT must be a valid port");

    let addr = format!("0.0.0.0:{}", port).parse()?;
    let service = HealthServiceImpl::default();

    tracing::info!("Health-check gRPC server listening on {}", addr);

    Server::builder()
        .add_service(HealthServiceServer::new(service))
        .serve(addr)
        .await?;

    Ok(())
}
