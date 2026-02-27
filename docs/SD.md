System Design
Data Flow: Request Lifecycle
Incoming Request: User hits api.erp.com/school/students.

Gateway:

Validates JWT.

Extracts tenant_id from claims.

Checks Redis cache for tenant_status. If suspended, reject immediately (402 Payment Required).

Service routing: Forwards request to School Plugin via gRPC.

Context Propagation: The tenant_id is passed in gRPC metadata headers.

Database Access:

Service opens connection to Postgres.

Sets session variable: SET app.current_tenant = '...';

Executes query. RLS automatically filters rows.

Response: JSON response returned to client.

Scaling Strategy (KEDA)
Metric: Queue depth (number of unprocessed NATS messages) or CPU usage.

Behavior:

If School Plugin creates a heavy report generation job, KEDA detects the lag.

Spins up 50 new pods of Report Worker.

Scales back to 0 when queue is empty (Serverless-like cost efficiency).

Security & Compliance
mTLS: All internal gRPC communication encrypted.

Audit Logging: Every write operation publishes an event to an immutable Audit Log service (crucial for hospitals/finance).