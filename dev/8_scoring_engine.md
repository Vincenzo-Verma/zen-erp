# 8. Scoring Engine & Billing Watchdog

## 8.1 Concept
The "Scoring Engine" is primarily a **Financial Health Monitor** in the MVP phase. It calculates whether a Tenant is "Healthy" (Solvent) or "Unhealthy" (Insolvent) in real-time. Future versions will include "Usage Score" and "feature adoption metrics".

## 8.2 The "Billing Watchdog" Service

### 8.2.1 Responsibility
A specialized background worker that:
1.  Consumes `BillableEvent` messages (e.g., *API Call*, *Storage Byte*, *Active User Day*).
2.  Aggregates costs against the Tenant's Wallet.
3.  Determines Tenant Status based on Balance.

### 8.2.2 State Machine
*   **Active**: `Balance > Threshold` (e.g., $0.00). Full access.
*   **Grace Period**: `Balance <= 0` BUT `DaysSinceZero < ConfiguredGrace` (e.g., 3 days). Access allowed, but Admin sees critical warnings.
*   **Suspended**: `Balance <= 0` AND `GracePeriodExpired`.
    *   API Gateway rejects all non-billing traffic (402 Payment Required).
    *   Background jobs for this tenant are paused.
*   **Archived**: `Suspended > 90 Days`. Data moved to cold storage.

## 8.3 Scoring Logic (Pseudocode)

```rust
fn calculate_health(tenant_id: Uuid) -> HealthStatus {
    let wallet = get_wallet(tenant_id);
    let usage_trend = analyze_usage_last_7_days(tenant_id);
    
    // Predictive Analysis
    let burn_rate = usage_trend.daily_avg_cost;
    let days_runway = wallet.balance / burn_rate;

    if wallet.balance <= 0.0 {
         if now() - wallet.last_positive_date > 3.days() {
             return HealthStatus::Suspended;
         } else {
             return HealthStatus::GracePeriod;
         }
    }

    if days_runway < 3.0 {
        emit_alert(LowBalance, tenant_id);
    }

    return HealthStatus::Active;
}
```

## 8.4 Integration with Event Bus
1.  **Input**: Services emit `ResourceConsumed { tenant_id, type: "storage", amount: 1GB }`.
2.  **Process**: Watchdog deducts cost from Wallet.
3.  **Output**: Watchdog emits `TenantSuspended { tenant_id }` if health drops.
4.  **Reaction**: Gateway updates its Redis cache to block further traffic immediately.
