//! Auth Service — gRPC server entry point.

use erp_proto::auth::auth_service_server::AuthServiceServer;
use tonic::transport::Server;

mod jwt;
mod password;
mod service;

use service::AuthServiceImpl;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();
    erp_logger::init_tracing("auth-service");

    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    let jwt_secret = std::env::var("JWT_SECRET")
        .unwrap_or_else(|_| "dev-secret-change-me-in-production".to_string());
    let port: u16 = std::env::var("AUTH_SERVICE_PORT")
        .unwrap_or_else(|_| "50052".to_string())
        .parse()
        .expect("AUTH_SERVICE_PORT must be a valid port");

    // Create DB pool
    let pool = erp_db_utils::create_pool(&database_url).await?;

    // Run migrations
    erp_db_utils::run_migrations(&pool).await?;

    let addr = format!("0.0.0.0:{}", port).parse()?;
    let auth_service = AuthServiceImpl::new(pool, jwt_secret);

    tracing::info!("Auth gRPC server listening on {}", addr);

    Server::builder()
        .add_service(AuthServiceServer::new(auth_service))
        .serve(addr)
        .await?;

    Ok(())
}
