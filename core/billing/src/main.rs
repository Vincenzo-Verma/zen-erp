//! Billing Service — gRPC server entry point.

use erp_proto::billing::billing_service_server::BillingServiceServer;
use tonic::transport::Server;

mod service;
use service::BillingServiceImpl;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();
    erp_logger::init_tracing("billing-service");

    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    let nats_url = std::env::var("NATS_URL")
        .unwrap_or_else(|_| "nats://localhost:4222".to_string());
    let port: u16 = std::env::var("BILLING_SERVICE_PORT")
        .unwrap_or_else(|_| "50054".to_string())
        .parse()
        .expect("BILLING_SERVICE_PORT must be a valid port");

    let pool = erp_db_utils::create_pool(&database_url).await?;
    erp_db_utils::run_migrations(&pool).await?;

    // Connect to NATS (optional — degrades gracefully)
    let nats_client = match erp_event_bus::connect(&nats_url).await {
        Ok(client) => {
            tracing::info!("Connected to NATS at {}", nats_url);
            Some(client)
        }
        Err(e) => {
            tracing::warn!("NATS not available ({}), events disabled", e);
            None
        }
    };

    let addr = format!("0.0.0.0:{}", port).parse()?;
    let billing_service = BillingServiceImpl::new(pool, nats_client);

    tracing::info!("Billing gRPC server listening on {}", addr);

    Server::builder()
        .add_service(BillingServiceServer::new(billing_service))
        .serve(addr)
        .await?;

    Ok(())
}
