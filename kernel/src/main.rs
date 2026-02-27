//! SaaS ERP Kernel — API Gateway & Orchestrator
//!
//! Responsibilities: Auth, Tenant Identification, Request Routing.
//! Proxies requests to plugin services with X-Tenant-ID context.

use axum::{
    routing::any,
    Router,
};
use std::net::SocketAddr;
use tower::ServiceBuilder;
use tower_http::trace::TraceLayer;

mod middleware;
mod router;

use axum::middleware;
use middleware::tenant::tenant_middleware;
use router::{plugin_router, RouterState};

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("saas_erp_kernel=info".parse().unwrap()),
        )
        .init();

    let state = RouterState::default();
    let app = Router::new()
        .route("/health", axum::routing::get(health))
        .route("/api/*path", any(plugin_router))
        .with_state(state)
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(middleware::from_fn(tenant_middleware)),
        );

    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    tracing::info!("Kernel listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.expect("bind");
    axum::serve(listener, app).await.expect("serve");
}

async fn health() -> &'static str {
    "ok"
}
