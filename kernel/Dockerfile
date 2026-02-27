# Kernel — Rust API Gateway (multi-stage)
FROM rust:1-bookworm AS builder
WORKDIR /app

COPY Cargo.toml Cargo.lock* ./
COPY src ./src

# Build release (use dummy main if needed for cache)
RUN cargo build --release

# Runtime image
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/saas-erp-kernel /usr/local/bin/
EXPOSE 8080
CMD ["/usr/local/bin/saas-erp-kernel"]
