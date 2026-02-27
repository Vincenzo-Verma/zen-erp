#!/usr/bin/env bash
# ─── Start All ERP Services ───
# Usage: ./scripts/dev.sh         (start all)
#        ./scripts/dev.sh stop    (stop all)

set -e

SERVICES=("auth-service" "tenancy-service" "billing-service" "gateway")
PIDS=()

stop_all() {
    echo "⏹  Stopping all services..."
    pkill -f "target/debug/auth-service" 2>/dev/null || true
    pkill -f "target/debug/tenancy-service" 2>/dev/null || true
    pkill -f "target/debug/billing-service" 2>/dev/null || true
    pkill -f "target/debug/gateway" 2>/dev/null || true
    sleep 1
    echo "✅ All services stopped."
}

if [ "${1:-}" = "stop" ]; then
    stop_all
    exit 0
fi

# Kill any existing instances first
stop_all 2>/dev/null

echo "🔨 Building workspace..."
cargo build --workspace 2>&1 | tail -3

echo ""
echo "🚀 Starting services..."

for svc in "${SERVICES[@]}"; do
    cargo run --bin "$svc" &>/dev/null &
    PIDS+=($!)
    echo "   ├─ $svc (PID $!)"
    sleep 1
done

echo ""
echo "✅ All services running!"
echo "   Gateway:  http://localhost:8080"
echo "   Auth:     grpc://localhost:50052"
echo "   Tenancy:  grpc://localhost:50053"
echo "   Billing:  grpc://localhost:50054"
echo ""
echo "Press Ctrl+C to stop all services."

# Trap Ctrl+C to clean shutdown
trap 'echo ""; stop_all; exit 0' INT TERM

# Wait for any child to exit
wait
