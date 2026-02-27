//! gRPC BillingService implementation — Wallet, Usage, and Health scoring.

use erp_proto::billing::billing_service_server::BillingService;
use erp_proto::billing::{
    CheckHealthRequest, GetWalletRequest, HealthStatusResponse, RecordUsageRequest,
    TopUpRequest, WalletResponse,
};
use sqlx::PgPool;
use tonic::{Request, Response, Status};
use uuid::Uuid;

pub struct BillingServiceImpl {
    pool: PgPool,
    nats_client: Option<async_nats::Client>,
}

impl BillingServiceImpl {
    pub fn new(pool: PgPool, nats_client: Option<async_nats::Client>) -> Self {
        Self { pool, nats_client }
    }

    /// Resolve the current status of a tenant based on wallet balance.
    async fn resolve_status(&self, tenant_id: Uuid) -> Result<(f64, String), Status> {
        let row = sqlx::query_as::<_, (sqlx::types::BigDecimal, Option<chrono::DateTime<chrono::Utc>>)>(
            "SELECT balance, last_positive_at FROM wallets WHERE tenant_id = $1",
        )
        .bind(tenant_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("DB error: {}", e)))?;

        let (balance_bd, last_positive_at) = match row {
            Some(r) => r,
            None => return Err(Status::not_found("Wallet not found for tenant")),
        };

        use sqlx::types::BigDecimal;
        use std::str::FromStr;

        let balance: f64 = balance_bd.to_string().parse().unwrap_or(0.0);
        let zero = BigDecimal::from_str("0").unwrap();

        let status = if balance_bd > zero {
            "active"
        } else {
            // Check grace period (3 days)
            match last_positive_at {
                Some(last_pos) => {
                    let days_since = (chrono::Utc::now() - last_pos).num_days();
                    if days_since < 3 {
                        "grace_period"
                    } else {
                        "suspended"
                    }
                }
                None => "suspended",
            }
        };

        Ok((balance, status.to_string()))
    }
}

#[tonic::async_trait]
impl BillingService for BillingServiceImpl {
    async fn get_wallet(
        &self,
        request: Request<GetWalletRequest>,
    ) -> Result<Response<WalletResponse>, Status> {
        let req = request.into_inner();
        let tenant_id: Uuid = req.tenant_id.parse()
            .map_err(|_| Status::invalid_argument("Invalid tenant_id"))?;

        let (balance, status) = self.resolve_status(tenant_id).await?;

        Ok(Response::new(WalletResponse {
            success: true,
            message: "Wallet retrieved".into(),
            balance,
            currency: "USD".into(),
            status,
        }))
    }

    async fn top_up_wallet(
        &self,
        request: Request<TopUpRequest>,
    ) -> Result<Response<WalletResponse>, Status> {
        let req = request.into_inner();
        let tenant_id: Uuid = req.tenant_id.parse()
            .map_err(|_| Status::invalid_argument("Invalid tenant_id"))?;

        let now = chrono::Utc::now();

        sqlx::query(
            "UPDATE wallets SET balance = balance + $1, last_positive_at = $2, updated_at = $2 WHERE tenant_id = $3",
        )
        .bind(sqlx::types::BigDecimal::from(req.amount as i64))
        .bind(now)
        .bind(tenant_id)
        .execute(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("DB error: {}", e)))?;

        // Update tenant status back to active if it was suspended
        sqlx::query("UPDATE tenants SET status = 'active' WHERE id = $1 AND status != 'active'")
            .bind(tenant_id)
            .execute(&self.pool)
            .await
            .map_err(|e| Status::internal(format!("DB error: {}", e)))?;

        let (balance, status) = self.resolve_status(tenant_id).await?;

        tracing::info!(tenant_id = %tenant_id, amount = req.amount, new_balance = balance, "Wallet topped up");

        Ok(Response::new(WalletResponse {
            success: true,
            message: format!("Added ${:.2}", req.amount),
            balance,
            currency: "USD".into(),
            status,
        }))
    }

    async fn record_usage(
        &self,
        request: Request<RecordUsageRequest>,
    ) -> Result<Response<WalletResponse>, Status> {
        let req = request.into_inner();
        let tenant_id: Uuid = req.tenant_id.parse()
            .map_err(|_| Status::invalid_argument("Invalid tenant_id"))?;

        let cost = req.amount * req.unit_cost;
        let now = chrono::Utc::now();

        // Deduct cost from wallet
        sqlx::query(
            "UPDATE wallets SET balance = balance - $1, updated_at = $2 WHERE tenant_id = $3",
        )
        .bind(sqlx::types::BigDecimal::from(cost as i64))
        .bind(now)
        .bind(tenant_id)
        .execute(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("DB error: {}", e)))?;

        let (balance, status) = self.resolve_status(tenant_id).await?;

        // If suspended, publish TenantSuspended event
        if status == "suspended" {
            if let Some(ref nats) = self.nats_client {
                let payload = serde_json::json!({
                    "event": "TenantSuspended",
                    "tenant_id": tenant_id.to_string(),
                    "balance": balance,
                });
                let _ = nats.publish(
                    "erp.events.tenant.suspended".to_string(),
                    payload.to_string().into(),
                ).await;
                tracing::warn!(tenant_id = %tenant_id, "TenantSuspended event published");
            }

            // Update tenant status
            sqlx::query("UPDATE tenants SET status = 'suspended' WHERE id = $1")
                .bind(tenant_id)
                .execute(&self.pool)
                .await
                .map_err(|e| Status::internal(format!("DB error: {}", e)))?;
        }

        Ok(Response::new(WalletResponse {
            success: true,
            message: format!("Charged ${:.2} for {}", cost, req.resource_type),
            balance,
            currency: "USD".into(),
            status,
        }))
    }

    async fn check_health(
        &self,
        request: Request<CheckHealthRequest>,
    ) -> Result<Response<HealthStatusResponse>, Status> {
        let req = request.into_inner();
        let tenant_id: Uuid = req.tenant_id.parse()
            .map_err(|_| Status::invalid_argument("Invalid tenant_id"))?;

        let (balance, status) = self.resolve_status(tenant_id).await?;

        // Simple burn rate estimation (placeholder — real impl uses usage_logs table)
        let daily_burn_rate = 1.0_f64; // $1/day placeholder
        let days_runway = if daily_burn_rate > 0.0 {
            balance / daily_burn_rate
        } else {
            f64::INFINITY
        };

        Ok(Response::new(HealthStatusResponse {
            status,
            balance,
            daily_burn_rate,
            days_runway,
        }))
    }
}
