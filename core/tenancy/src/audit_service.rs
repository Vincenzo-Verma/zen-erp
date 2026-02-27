//! gRPC AuditService implementation.

use erp_proto::audit::audit_service_server::AuditService;
use erp_proto::audit::{
    AuditEvent, ListEventsRequest, ListEventsResponse, RecordEventRequest, RecordEventResponse,
};
use sqlx::PgPool;
use tonic::{Request, Response, Status};
use uuid::Uuid;

/// Audit service backed by Postgres.
pub struct AuditServiceImpl {
    pool: PgPool,
}

impl AuditServiceImpl {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[tonic::async_trait]
impl AuditService for AuditServiceImpl {
    async fn record_event(
        &self,
        request: Request<RecordEventRequest>,
    ) -> Result<Response<RecordEventResponse>, Status> {
        let req = request.into_inner();

        let tenant_id: Uuid = req
            .tenant_id
            .parse()
            .map_err(|_| Status::invalid_argument("Invalid tenant_id UUID"))?;

        let user_id: Option<Uuid> = if req.user_id.is_empty() {
            None
        } else {
            Some(
                req.user_id
                    .parse()
                    .map_err(|_| Status::invalid_argument("Invalid user_id UUID"))?,
            )
        };

        let event_id = Uuid::new_v4();

        // Use a transaction so we can SET LOCAL the RLS tenant context
        let mut tx = self.pool.begin().await
            .map_err(|e| Status::internal(format!("DB begin error: {e}")))?;

        sqlx::query("SELECT set_config('app.current_tenant', $1, true)")
            .bind(tenant_id.to_string())
            .execute(&mut *tx)
            .await
            .map_err(|e| Status::internal(format!("DB set tenant error: {e}")))?;

        sqlx::query(
            "INSERT INTO audit_log (id, tenant_id, user_id, user_email, action, resource_type, resource_id, details, ip_address) \
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)",
        )
        .bind(event_id)
        .bind(tenant_id)
        .bind(user_id)
        .bind(&req.user_email)
        .bind(&req.action)
        .bind(&req.resource_type)
        .bind(if req.resource_id.is_empty() { None } else { Some(&req.resource_id) })
        .bind(if req.details_json.is_empty() { "{}" } else { &req.details_json })
        .bind(&req.ip_address)
        .execute(&mut *tx)
        .await
        .map_err(|e| Status::internal(format!("DB insert error: {e}")))?;

        tx.commit().await
            .map_err(|e| Status::internal(format!("DB commit error: {e}")))?;

        tracing::info!(
            event_id = %event_id,
            tenant_id = %tenant_id,
            action = %req.action,
            "Audit event recorded"
        );

        Ok(Response::new(RecordEventResponse {
            success: true,
            event_id: event_id.to_string(),
        }))
    }

    async fn list_events(
        &self,
        request: Request<ListEventsRequest>,
    ) -> Result<Response<ListEventsResponse>, Status> {
        let req = request.into_inner();

        let tenant_id: Uuid = req
            .tenant_id
            .parse()
            .map_err(|_| Status::invalid_argument("Invalid tenant_id UUID"))?;

        let limit = if req.limit <= 0 { 50 } else { req.limit };
        let offset = if req.offset < 0 { 0 } else { req.offset };

        // Build dynamic query with optional filters
        let mut query = String::from(
            "SELECT id, tenant_id, COALESCE(user_id::text, ''), COALESCE(user_email, ''), \
             action, resource_type, COALESCE(resource_id, ''), \
             COALESCE(details::text, '{}'), COALESCE(ip_address, ''), created_at \
             FROM audit_log WHERE tenant_id = $1",
        );
        let mut param_idx = 2u32;

        if !req.action_filter.is_empty() {
            query.push_str(&format!(" AND action = ${param_idx}"));
            param_idx += 1;
        }

        if !req.resource_type_filter.is_empty() {
            query.push_str(&format!(" AND resource_type = ${param_idx}"));
            param_idx += 1;
        }

        query.push_str(&format!(
            " ORDER BY created_at DESC LIMIT ${} OFFSET ${}",
            param_idx,
            param_idx + 1
        ));

        // Build and run query dynamically within a transaction for RLS
        let mut tx = self.pool.begin().await
            .map_err(|e| Status::internal(format!("DB begin error: {e}")))?;

        sqlx::query("SELECT set_config('app.current_tenant', $1, true)")
            .bind(tenant_id.to_string())
            .execute(&mut *tx)
            .await
            .map_err(|e| Status::internal(format!("DB set tenant error: {e}")))?;

        let rows = {
            let mut q = sqlx::query_as::<
                _,
                (
                    Uuid,
                    Uuid,
                    String,
                    String,
                    String,
                    String,
                    String,
                    String,
                    String,
                    chrono::DateTime<chrono::Utc>,
                ),
            >(&query)
            .bind(tenant_id);

            if !req.action_filter.is_empty() {
                q = q.bind(&req.action_filter);
            }
            if !req.resource_type_filter.is_empty() {
                q = q.bind(&req.resource_type_filter);
            }

            q = q.bind(limit as i64).bind(offset as i64);
            q.fetch_all(&mut *tx).await
        }
        .map_err(|e| Status::internal(format!("DB query error: {e}")))?;

        // Total count for pagination
        let total_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM audit_log WHERE tenant_id = $1")
            .bind(tenant_id)
            .fetch_one(&mut *tx)
            .await
            .map_err(|e| Status::internal(format!("DB count error: {e}")))?;

        tx.commit().await
            .map_err(|e| Status::internal(format!("DB commit error: {e}")))?;

        let events = rows
            .into_iter()
            .map(
                |(id, tid, uid, email, action, rtype, rid, details, ip, created)| AuditEvent {
                    id: id.to_string(),
                    tenant_id: tid.to_string(),
                    user_id: uid,
                    user_email: email,
                    action,
                    resource_type: rtype,
                    resource_id: rid,
                    details_json: details,
                    ip_address: ip,
                    created_at: created.to_rfc3339(),
                },
            )
            .collect();

        Ok(Response::new(ListEventsResponse {
            events,
            total_count: total_count as i32,
        }))
    }
}
