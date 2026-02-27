//! REST → gRPC bridge for Billing service.

use axum::{
    extract::{Json, Path},
    response::IntoResponse,
};
use serde::Deserialize;

use erp_proto::billing::billing_service_client::BillingServiceClient;
use erp_proto::billing::*;

fn billing_addr() -> String {
    std::env::var("BILLING_SERVICE_ADDR").unwrap_or_else(|_| "http://127.0.0.1:50054".into())
}

// ── GET /api/v1/billing/wallet/:tenant_id ──

pub async fn get_wallet_handler(Path(tenant_id): Path<String>) -> impl IntoResponse {
    let mut client = match BillingServiceClient::connect(billing_addr()).await {
        Ok(c) => c,
        Err(e) => return Json(serde_json::json!({"error": format!("Connect: {e}")})),
    };
    match client.get_wallet(GetWalletRequest { tenant_id }).await {
        Ok(resp) => {
            let w = resp.into_inner();
            Json(serde_json::json!({
                "success": w.success,
                "balance": w.balance,
                "currency": w.currency,
                "status": w.status,
            }))
        }
        Err(e) => Json(serde_json::json!({"error": e.message()})),
    }
}

// ── POST /api/v1/billing/topup ──

#[derive(Deserialize)]
pub struct TopUpBody {
    pub tenant_id: String,
    pub amount: f64,
    #[serde(default)]
    pub description: String,
}

pub async fn topup_handler(Json(body): Json<TopUpBody>) -> impl IntoResponse {
    let mut client = match BillingServiceClient::connect(billing_addr()).await {
        Ok(c) => c,
        Err(e) => return Json(serde_json::json!({"error": format!("Connect: {e}")})),
    };
    match client
        .top_up_wallet(TopUpRequest {
            tenant_id: body.tenant_id,
            amount: body.amount,
            description: body.description,
        })
        .await
    {
        Ok(resp) => {
            let w = resp.into_inner();
            Json(serde_json::json!({
                "success": w.success,
                "message": w.message,
                "balance": w.balance,
                "currency": w.currency,
                "status": w.status,
            }))
        }
        Err(e) => Json(serde_json::json!({"error": e.message()})),
    }
}

// ── POST /api/v1/billing/usage ──

#[derive(Deserialize)]
pub struct RecordUsageBody {
    pub tenant_id: String,
    pub resource_type: String,
    pub amount: f64,
    #[serde(default = "default_unit_cost")]
    pub unit_cost: f64,
}

fn default_unit_cost() -> f64 { 1.0 }

pub async fn record_usage_handler(Json(body): Json<RecordUsageBody>) -> impl IntoResponse {
    let mut client = match BillingServiceClient::connect(billing_addr()).await {
        Ok(c) => c,
        Err(e) => return Json(serde_json::json!({"error": format!("Connect: {e}")})),
    };
    match client
        .record_usage(RecordUsageRequest {
            tenant_id: body.tenant_id,
            resource_type: body.resource_type,
            amount: body.amount,
            unit_cost: body.unit_cost,
        })
        .await
    {
        Ok(resp) => {
            let w = resp.into_inner();
            Json(serde_json::json!({
                "success": w.success,
                "message": w.message,
                "balance": w.balance,
                "status": w.status,
            }))
        }
        Err(e) => Json(serde_json::json!({"error": e.message()})),
    }
}

// ── GET /api/v1/billing/health/:tenant_id ──

pub async fn check_health_handler(Path(tenant_id): Path<String>) -> impl IntoResponse {
    let mut client = match BillingServiceClient::connect(billing_addr()).await {
        Ok(c) => c,
        Err(e) => return Json(serde_json::json!({"error": format!("Connect: {e}")})),
    };
    match client
        .check_health(CheckHealthRequest { tenant_id })
        .await
    {
        Ok(resp) => {
            let h = resp.into_inner();
            Json(serde_json::json!({
                "status": h.status,
                "balance": h.balance,
                "daily_burn_rate": h.daily_burn_rate,
                "days_runway": h.days_runway,
            }))
        }
        Err(e) => Json(serde_json::json!({"error": e.message()})),
    }
}
