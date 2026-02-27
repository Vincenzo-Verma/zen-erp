//! SaaS ERP Gateway — API Entry Point & Orchestrator
//!
//! Routes:
//! - GET  /health              → local liveness
//! - GET  /health/grpc         → downstream gRPC probe
//! - POST /api/v1/auth/*       → Auth service
//! - *    /api/v1/tenants/*    → Tenancy service
//! - *    /api/v1/billing/*    → Billing service
//! - *    /api/v1/school/*     → School plugin
//! - GET  /api/v1/audit/*      → Audit service

use axum::{routing::{get, post}, Router};
use std::net::SocketAddr;
use tower::ServiceBuilder;
use tower_http::trace::TraceLayer;

mod grpc_health;
mod middleware;
mod router;
mod audit_helper;
mod routes_audit;
mod routes_auth;
mod routes_billing;
mod routes_school;
mod routes_tenancy;

use axum::middleware as axum_mw;
use middleware::tenant::tenant_middleware;

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    erp_logger::init_tracing("gateway");

    let port: u16 = std::env::var("GATEWAY_PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse()
        .expect("GATEWAY_PORT must be a valid port");

    // ── v1 API routes (REST → gRPC) ──
    let v1_routes = Router::new()
        // Auth
        .route("/auth/register", post(routes_auth::register_handler))
        .route("/auth/login", post(routes_auth::login_handler))
        .route("/auth/login/school/:slug", post(routes_auth::school_login_handler))
        .route("/auth/verify", post(routes_auth::verify_handler))
        // Tenancy
        .route("/tenants", post(routes_tenancy::create_tenant_handler))
        .route("/tenants/:id", get(routes_tenancy::get_tenant_handler))
        .route("/tenants/user/:user_id", get(routes_tenancy::list_tenants_handler))
        .route("/tenants/:id/users", post(routes_tenancy::add_user_to_tenant_handler))
        .route("/tenants/:id/roles", get(routes_tenancy::list_roles_handler))
        .route("/tenants/:id/users-with-roles", get(routes_tenancy::list_tenant_users_handler))
        .route("/tenants/:id/plugins", get(routes_tenancy::list_plugins_handler))
        .route("/tenants/:id/plugins/activate", post(routes_tenancy::activate_plugin_handler))
        .route("/tenants/:id/plugins/deactivate", post(routes_tenancy::deactivate_plugin_handler))
        .route("/tenants/:id/domain", axum::routing::put(routes_tenancy::update_domain_handler))
        .route("/tenants/:id/prefix", axum::routing::put(routes_tenancy::update_prefix_handler))
        // Billing
        .route("/billing/wallet/:tenant_id", get(routes_billing::get_wallet_handler))
        .route("/billing/topup", post(routes_billing::topup_handler))
        .route("/billing/usage", post(routes_billing::record_usage_handler))
        .route("/billing/health/:tenant_id", get(routes_billing::check_health_handler))
        // School Plugin — Students
        .route("/school/students", post(routes_school::admit_student_handler))
        .route("/school/students/:tenant_id", get(routes_school::list_students_handler))
        .route("/school/student/:tenant_id/:student_id", get(routes_school::get_student_handler)
            .put(routes_school::update_student_handler)
            .delete(routes_school::delete_student_handler))
        .route("/school/student/:tenant_id/:student_id/password", post(routes_school::update_student_password_handler))
        // School Plugin — Staff
        .route("/school/staff", post(routes_school::onboard_staff_handler))
        .route("/school/staff/:tenant_id", get(routes_school::list_staff_handler))
        .route("/school/staff/:tenant_id/:staff_id", get(routes_school::get_staff_handler))
        // School Plugin — Number Generation
        .route("/school/next-number/:tenant_id/:type", get(routes_school::get_next_number_handler))
        // Audit
        .route("/audit/:tenant_id", get(routes_audit::list_audit_events_handler));

    let app = Router::new()
        .route("/health", get(health))
        .route("/health/grpc", get(grpc_health::check_grpc_health))
        .nest("/api/v1", v1_routes)
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(axum_mw::from_fn(tenant_middleware)),
        );

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("Gateway listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.expect("bind");
    axum::serve(listener, app).await.expect("serve");
}

async fn health() -> &'static str {
    "ok"
}
