# 9. Engineering Scope Definition

## 9.1 In-Scope (MVP)

### 9.1.1 Core Platform (The Kernel)
*   **Authentication**: Login, Registration, JWT handling, Password Reset.
*   **Tenancy**: Create Tenant, Switch Context, RLS Infrastructure.
*   **Billing**: Wallet management, Payment Gateway integration (Stripe basics), Auto-Cutoff watchdog.
*   **API Gateway**: Route dispatch, SSL, Rate Limiting.

### 9.1.2 First Vertical: School Management Plugin
*   **Entities**: Students, Teachers, Classes.
*   **Features**: Admission form, Attendance marking (daily), Basic Reporting.
*   **Goal**: Demonstrate that the "Plugin" architecture works end-to-end.

### 9.1.3 Infrastructure
*   **Kubernetes Cluster**: Development/Staging environment.
*   **PostgreSQL**: Single instance (managed or self-hosted) with RLS enabled.
*   **Event Bus**: NATS JetStream setup.
*   **CI/CD**: Basic GitHub Actions pipeline to build and test.

## 9.2 Out-of-Scope (Post-MVP)

### 9.2.1 Advanced Billing
*   Complex tiered subscriptions (Gold/Platinum).
*   Invoicing generation (PDFs).
*   Tax calculation engines.

### 9.2.2 Plugin Marketplace
*   Public-facing "App Store" UI for third-party developers.
*   Dynamic runtime loading of *new* binary plugins (Plugins must be compiled into the release for now).

### 9.2.3 Analytics & OLAP
*   Data warehousing.
*   Long-term trend analysis.

### 9.2.4 Legacy Integrations
*   Import/Export from Excel/CSV (limited support ok, but not full ETL).
