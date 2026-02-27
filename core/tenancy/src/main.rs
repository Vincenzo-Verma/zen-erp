//! Tenancy Service — gRPC server entry point.

use erp_proto::audit::audit_service_server::AuditServiceServer;
use erp_proto::tenancy::tenancy_service_server::TenancyServiceServer;
use tonic::transport::Server;

mod audit_service;
mod service;

use audit_service::AuditServiceImpl;
use service::TenancyServiceImpl;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();
    erp_logger::init_tracing("tenancy-service");

    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    let port: u16 = std::env::var("TENANCY_SERVICE_PORT")
        .unwrap_or_else(|_| "50053".to_string())
        .parse()
        .expect("TENANCY_SERVICE_PORT must be a valid port");

    let pool = erp_db_utils::create_pool(&database_url).await?;
    erp_db_utils::run_migrations(&pool).await?;

    let addr = format!("0.0.0.0:{}", port).parse()?;
    let tenancy_service = TenancyServiceImpl::new(pool.clone());
    let audit_service = AuditServiceImpl::new(pool);

    tracing::info!("Tenancy gRPC server listening on {}", addr);

    Server::builder()
        .add_service(TenancyServiceServer::new(tenancy_service))
        .add_service(AuditServiceServer::new(audit_service))
        .serve(addr)
        .await?;

    Ok(())
}
