//! # erp-db-utils
//!
//! Shared database utilities for the SaaS ERP platform.
//! Provides connection pooling, RLS tenant context helpers, and migration support.

use sqlx::postgres::{PgPool, PgPoolOptions};
use uuid::Uuid;

/// Errors from database utility operations.
#[derive(Debug, thiserror::Error)]
pub enum DbError {
    #[error("sqlx error: {0}")]
    Sqlx(#[from] sqlx::Error),

    #[error("migration error: {0}")]
    Migrate(#[from] sqlx::migrate::MigrateError),
}

/// Create a new Postgres connection pool.
///
/// Reads `DATABASE_URL` from the provided string.
pub async fn create_pool(database_url: &str) -> Result<PgPool, DbError> {
    let pool = PgPoolOptions::new()
        .max_connections(20)
        .connect(database_url)
        .await?;

    tracing::info!("Database pool created (max_connections=20)");
    Ok(pool)
}

/// Set the RLS tenant context on a connection.
///
/// This MUST be called before any tenant-scoped query.
/// It sets `app.current_tenant` so Postgres RLS policies filter rows automatically.
///
/// # Example
/// ```ignore
/// let mut conn = pool.acquire().await?;
/// set_tenant_context(&mut conn, tenant_id).await?;
/// // All subsequent queries on `conn` are now scoped to this tenant
/// ```
pub async fn set_tenant_context(
    conn: &mut sqlx::PgConnection,
    tenant_id: Uuid,
) -> Result<(), DbError> {
    let query = format!(
        "SET LOCAL app.current_tenant = '{}'",
        tenant_id
    );
    sqlx::query(&query).execute(&mut *conn).await?;
    tracing::debug!(tenant_id = %tenant_id, "RLS tenant context set");
    Ok(())
}

/// Run all pending SQL migrations from the `migrations/` directory.
pub async fn run_migrations(pool: &PgPool) -> Result<(), DbError> {
    sqlx::migrate!("../../migrations")
        .run(pool)
        .await?;
    tracing::info!("Database migrations applied");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_db_error_display() {
        let err = DbError::Sqlx(sqlx::Error::RowNotFound);
        assert!(err.to_string().contains("sqlx error"));
    }
}
