MVP Technical Documentation
Tech Stack
Backend Language: Rust (Tokio, Tonic for gRPC).

Communication: gRPC (Internal), REST/GraphQL (External API Gateway).

Database: PostgreSQL 16+ (leveraging RLS policies).

Infrastructure: Kubernetes (K8s) with KEDA for event-driven autoscaling.

Message Broker: NATS JetStream (for lightweight, high-performance pub/sub).

Core Modules (MVP Scope)
Auth & Tenancy Service:

Responsibility: Login, JWT issuance, Tenant creation.

Key Tech: Argon2 hashing, PASETO/JWT tokens with custom claims (tenant_id).

Billing Watchdog:

Responsibility: Monitors usage (API calls/storage).

Action: If balance <= 0, it publishes a TenantSuspended event. All other services subscribe to this and reject requests for that tenant_id.

One Vertical Plugin (e.g., School Management):

Scope: Student admission, Attendance tracking.

Goal: Prove the plugin architecture works.

Database Schema Strategy (RLS)
SQL
-- Example RLS Policy
CREATE TABLE students (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    ...
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON students
    USING (tenant_id = current_setting('app.current_tenant')::uuid);