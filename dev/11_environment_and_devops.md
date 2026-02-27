# 11. Environment & DevOps Strategy

## 11.1 Local Development
*   **Tools**: Docker Compose, Cargo, `sqlx-cli`.
*   **Stack**:
    *   App Services (Hot-reloading via `cargo watch`).
    *   Postgres (Standard image).
    *   NATS (Standard image).
    *   Mailhog (SMTP testing).

## 11.2 Production Infrastructure (Kubernetes)
*   **Cluster**: Managed K8s (EKS/GKE/DigitalOcean).
*   **Ingress**: Nginx Ingress Controller (handling SSL and routing).
*   **Cert Manager**: Let's Encrypt auto-renewal.

## 11.3 Autoscaling (KEDA)
*   **Event-Driven**: Why scale on CPU when you can scale on *Demand*?
*   **Triggers**:
    *   `nats-jetstream-topic-lag`: If `bill_generation_queue` > 1000 messages, scale `billing-worker` from 2 -> 5 replicas.
    *   `cpu`: Classic fallback if simple load increases.

## 11.4 Database Management
*   **Connection Pooling**: `PgBouncer` (essential for distinct tenant connections).
*   **Backups**: WAL-G or cloud-native snapshots (daily + continuous WAL archiving).

## 11.5 Observability
*   **Metrics**: Prometheus + Grafana (scrape K8s pods).
*   **Logs**: Loki (structured JSON logs from Rust tracing).
*   **Tracing**: OpenTelemetry (Jaeger/Tempo) for visualizing the request path: Gateway -> Core -> Plugin -> DB.
