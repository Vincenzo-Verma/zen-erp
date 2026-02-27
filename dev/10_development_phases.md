# 10. Development Phases

## Phase 1: Foundation (Weeks 1-2)
*   **Goal**: "Walking Skeleton".
*   **Tasks**:
    *   Set up Rust Monorepo.
    *   Configure CI/CD.
    *   Spin up local Dev Environment (Docker Compose: Postgres + NATS).
    *   Implement "Hello World gRPC" between Gateway and a dummy Service.

## Phase 2: The Core Kernel (Weeks 3-5)
*   **Goal**: Multi-tenancy works.
*   **Tasks**:
    *   Implement `core/auth`: User registration, JWT issuance.
    *   Implement `core/tenancy`: DB Schema migration, RLS policy testing.
    *   Verify: User A can log in, create Tenant X, and NOT see Tenant Y's data.

## Phase 3: Billing & Events (Weeks 6-7)
*   **Goal**: "Pay-to-Play".
*   **Tasks**:
    *   Implement `core/billing`: Wallets table.
    *   Implement `Billing Watchdog` state machine.
    *   Test: Manually set balance to 0 and verify API rejection.

## Phase 4: First Plugin (Weeks 8-10)
*   **Goal**: Business Value.
*   **Tasks**:
    *   Develop `plugins/school` (Students, Attendance).
    *   Connect Plugin to Event Bus.
    *   Frontend: Build "Tenant Switcher" and "Plugin Dashboard".

## Phase 5: Polish & Pre-Launch (Weeks 11-12)
*   **Goal**: Production Ready.
*   **Tasks**:
    *   Load Testing (K6).
    *   Security Audit (RLS pen-testing).
    *   Docs writing.
    *   Deploy to Staging K8s cluster.
