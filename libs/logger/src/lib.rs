//! # erp-logger
//!
//! Centralized tracing/logging setup for all SaaS ERP services.
//! Call `init_tracing()` once at service startup.

use tracing_subscriber::{fmt, EnvFilter};

/// Initialize the global tracing subscriber.
///
/// Reads `RUST_LOG` env var for filtering (defaults to `info`).
/// Outputs structured logs to stdout.
pub fn init_tracing(service_name: &str) {
    let env_filter = std::env::var("RUST_LOG").unwrap_or_else(|_| "info".to_string());
    let filter_string = if env_filter == "debug" || env_filter == "trace" {
        format!("{env_filter},h2=info,tower=info,hyper=info,tonic=info")
    } else {
        env_filter
    };
    let filter = EnvFilter::new(filter_string);

    fmt()
        .with_env_filter(filter)
        .with_target(true)
        .with_thread_ids(false)
        .with_file(false)
        .with_line_number(false)
        .init();

    tracing::info!(service = service_name, "Tracing initialized");
}
