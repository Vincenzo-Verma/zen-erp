# 7. Monorepo Structure

## 7.1 Overview
A broad, `cargo`-based workspace structure. It separates "Core" infrastructure from "Plugin" business logic to ensure strict compile-time boundaries.

## 7.2 Directory Tree

```text
/
├── Cargo.toml          # Workspace root
├── bin/                # Entry points
│   └── gateway/        # The Edge API Gateway
├── core/               # The Kernel
│   ├── auth/           # Identity Service
│   ├── tenancy/        # Organization Manager
│   ├── billing/        # Wallet & Accounting
│   └── event-bus/      # NATS Abstraction
├── plugins/            # Business Logic Verticals
│   ├── school/         # School ERP features
│   ├── inventory/      # General Inventory
│   └── hospital/       # OPD/IPD features
├── libs/               # Shared Libraries
│   ├── db-utils/       # Pooling, RLS helpers
│   ├── proto/          # Generated gRPC code (Tonic)
│   └── logger/         # Structured logging setup
├── infra/              # Infrastructure-as-Code
│   ├── k8s/            # Kubernetes Manifests
│   ├── docker/         # Dockerfiles
│   └── terraform/      # Cloud provisioning
└── scripts/            # Dev tooling
    ├── deploy.sh
    └── migrate_all.sh
```

## 7.3 Workspace Configuration (`Cargo.toml`)
```toml
[workspace]
members = [
  "bin/*",
  "core/*",
  "plugins/*",
  "libs/*"
]
resolver = "2"
```

## 7.4 CI/CD Considerations
*   **Independent Building**: Changes in `plugins/school` should trigger a build/test pipeline only for the School Service and Gateway, not the Hospital Service.
*   **Dockerization**: Each service in `core/` and `plugins/` has its own `Dockerfile` for independent deployment and scaling.
