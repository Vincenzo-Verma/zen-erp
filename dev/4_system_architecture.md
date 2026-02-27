# 4. System Architecture

## 4.1 Architectural Pattern: Microkernel (Core + Plugins)
The system adopts a **Microkernel Architecture** (also known as the Plugin Architecture). This allows the application to stay lightweight while being extensible for various school needs.

*   **Core System (Kernel)**: Contains only the logic required to run the platform (Identity, Tenancy, Billing, Event Bus).
*   **Plugins (Verticals)**: Independent microservices that implement specific business logic (e.g., Gradebook, Transport).

## 4.2 High-Level Diagram

```mermaid
graph TD
    Client[Web/Mobile Apps] -->|HTTPS| Gateway[API Gateway]
    
    subgraph "Core System (Kernel)"
        Gateway --> Auth[Identity Provider]
        Gateway --> Tenant[Tenant Manager]
        Gateway --> Billing[Billing Engine]
        Tenant --> DB[(Postgres Core DB)]
        Auth --> DB
        Billing --> DB
    end
    
    subgraph "Event Backbone"
        Bus[Event Bus (NATS JetStream)]
    end
    
    subgraph "School Plugins (Microservices)"
        Gateway -->|gRPC| School[School Core Plugin]
        Gateway -->|gRPC| Attendance[Attendance Plugin]
        Gateway -->|gRPC| Fees[Fee Management Plugin]
        
        School --> Bus
        Attendance --> Bus
        Fees --> Bus
        
        Bus -->|StudentAdmitted| Attendance
        Bus -->|StudentAdmitted| Fees
    end

    School --> DB
    Attendance --> DB
    Fees --> DB
```

## 4.3 Key Components

### 4.3.1 API Gateway & Routing Strategy
*   **Role**: Entry point for all external traffic.
*   **School Routing**:
    *   `*.saas-erp.com` (Subdomain) OR `saas-erp.com/school/:slug` (Path-based).
    *   Gateway resolves the `slug` to a `tenant_id` via the Tenant Cache.
*   **Portal Routing**:
    *   `/admin/*` -> Admin Portal (School configuration, analytics).
    *   `/staff/*` -> Staff Portal (Attendance, Grades).
    *   `/student/*` -> Student Portal (Reports, Fees).

### 4.3.2 The Kernel (Core Services)
1.  **Identity Provider (IdP)**: Manages User/Admin identities. Support for parent/student accounts linked to multiple students.
2.  **Tenant Manager**: Manages School lifecycle, RLS policy enforcement.
3.  **Billing Engine**: Aggregates usage across all schools owned by a Super Admin for a single invoice.

### 4.3.3 Cumulative Analytics Aggregator
*   **Purpose**: Provide Super Admins with a bird's-eye view.
*   **Mechanism**: A specialized read-only service that queries across multiple tenant schemas (or uses a materialized view) to aggregate:
    *   Total Revenue (Fees collected).
    *   Total Student Enrollment.
    *   Staff Attendance trends.

### 4.3.4 Plugin Layer
*   **Apps**: `service-school` (Core school logic), `service-attendance`, `service-fees`.
*   **Protocol**: gRPC (High performance internal comms).
*   **Isolation**: Plugins do not speak to each other directly. They produce/consume events via the Bus.

## 4.4 Data Flow: Multi-School Admin View
1.  **Request**: Super Admin requests `GET /analytics/cumulative`.
2.  **Auth**: Gateway validates Token, identifies user as "Super Admin".
3.  **Execution**: Analytics Service queries the DB for all tenants owned by this user.
4.  **Aggregation**: Data is summed/averaged on the fly (or fetched from cache).
5.  **Response**: JSON payload with aggregated metrics.

## 4.5 Security & Compliance
*   **Data Sovereignty**: Option to shard specific high-value schools to separate DBs if needed.
*   **COPPA/GDPR**: Strict controls on student data visibility.
