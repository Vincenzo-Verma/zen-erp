# 12. Testing Strategy

## 12.1 Philosophy
"Test at the lowest level possible." Rust's type system catches many bugs, but logic bugs need comprehensive testing.

## 12.2 Levels of Testing

### 12.2.1 Unit Tests (Rust)
*   **Scope**: Individual functions, domain logic.
*   **Tool**: `cargo test`.
*   **Focus**: Scoring algorithms, JWT parsing, Parsing logic.
*   **Metric**: 80% Code Coverage.

### 12.2.2 Integration Tests (Service Level)
*   **Scope**: A single service talking to a real DB.
*   **Tool**: `sqlx::test` (spins up a transaction per test and rolls back).
*   **Focus**:
    *   **RLS Verification**: Crucial! Test that `SELECT * FROM students` returns 0 rows if `tenant_id` is not set.

### 12.2.3 API Integration Tests (End-to-End)
*   **Scope**: HTTP requests against the running Gateway.
*   **Tool**: Postman / Bruno / Python `pytest`.
*   **Scenario**:
    1.  Register User.
    2.  Create Tenant.
    3.  Login (Get Token).
    4.  Create Student.
    5.  Verify Student exists.
    6.  Switch Tenant.
    7.  Verify Student is *not* visible.

### 12.2.4 Load Testing
*   **Tool**: K6 (Javascript-based load tester).
*   **Target**: 10,000 Concurrent Virtual Users (VUs).
*   **Scenario**: "Morning Rush" - 10k teachers marking attendance simultaneously.
*   **Pass Criteria**: p95 Response Time < 200ms. Error rate < 0.1%.

## 12.3 Continuous Integration (CI)
*   **Triggers**: Pull Request, Merge to Main.
*   **Pipeline**:
    1.  `cargo fmt --check`
    2.  `cargo clippy` (Linting)
    3.  `cargo test` (Unit)
    4.  `cargo test --ignored` (Heavy Integration tests)
    5.  `docker build`
