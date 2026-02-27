//! School Plugin — gRPC Service Entry Point
//!
//! Runs the StudentService + StaffService + NumberService on SCHOOL_SERVICE_PORT.

use erp_proto::school::student_service_server::StudentServiceServer;
use erp_proto::school::staff_service_server::StaffServiceServer;
use erp_proto::school::number_service_server::NumberServiceServer;
use std::net::SocketAddr;
use tonic::transport::Server;

use erp_school::service::SchoolService;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();
    erp_logger::init_tracing("school-service");

    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL required");
    let port: u16 = std::env::var("SCHOOL_SERVICE_PORT")
        .unwrap_or_else(|_| "50060".to_string())
        .parse()
        .expect("SCHOOL_SERVICE_PORT must be valid");

    let pool = erp_db_utils::create_pool(&db_url).await.expect("DB pool creation failed");
    erp_db_utils::run_migrations(&pool).await.expect("Migration failed");

    let school_svc = SchoolService::new(pool);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("School service listening on {}", addr);

    Server::builder()
        .add_service(StudentServiceServer::new(school_svc.clone()))
        .add_service(StaffServiceServer::new(school_svc.clone()))
        .add_service(NumberServiceServer::new(school_svc))
        .serve(addr)
        .await?;

    Ok(())
}
