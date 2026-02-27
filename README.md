# SaaS ERP — Multi-Tenant Microkernel Platform

A highly scalable, multi-tenant SaaS ERP using a **Microkernel Architecture** with a Rust core (Kernel) and Python plugin microservices, orchestrated on Kubernetes.

## Architecture Overview

```
                    ┌─────────────────────────────────────────┐
                    │  *.saas-erp.com (Nginx Ingress)          │
                    └─────────────────────┬───────────────────┘
                                          │
                    ┌─────────────────────▼───────────────────┐
                    │  KERNEL (Rust)                           │
                    │  • Auth • Tenant-ID • Request Routing    │
                    │  • Proxies to plugins with X-Tenant-ID   │
                    └─────────────────────┬───────────────────┘
                                          │
          ┌───────────────────────────────┼───────────────────────────────┐
          │                               │                               │
          ▼                               ▼                               ▼
   finance-service                 hr-service                    inventory-service
   (Python)                       (Python)                       (Python)
```

## Repository Structure

```
saas-erp/
├── kernel/                 # Core orchestrator (Rust)
│   ├── src/
│   │   ├── main.rs
│   │   ├── middleware/
│   │   └── router/
│   └── Cargo.toml
├── plugins/
│   └── finance/            # Finance plugin (Python)
│       ├── app/
│       ├── Dockerfile
│       └── requirements.txt
├── infrastructure/
│   └── k8s/                # Kubernetes manifests
│       ├── ingress.yaml
│       ├── kernel-deployment.yaml
│       └── finance-deployment.yaml
├── frontend/               # HTML, Tailwind, JS (API consumers)
└── README.md
```

## Tenant Context

- **Identification**: Subdomain (`tenant1.saas-erp.com`) or header (`X-Tenant-ID: tenant1`).
- **Propagation**: Kernel sets `X-Tenant-ID` on every request forwarded to plugins so they can scope data (e.g. schema per tenant).

## Quick Start

### Prerequisites

- Rust, Python 3.11+, Podman, kubectl, Kubernetes (minikube/kind/k3s)

### Build & Run Locally

```bash
# Kernel (Rust)
# On Windows, if you get "link.exe not found", see kernel/BUILDING.md or run:
#   cd kernel && .\use-gnu-toolchain.ps1
cd kernel && cargo run

# Finance plugin
cd plugins/finance && pip install -r requirements.txt && uvicorn app.main:app --reload

# Call: GET http://localhost:8080/api/finance/invoice (with X-Tenant-ID or subdomain)
```

### Kubernetes (Podman / K8s)

```bash
# 1. Create namespace
kubectl apply -f infrastructure/k8s/namespace.yaml

# 2. Build images (Podman; kernel build may require Linux/WSL if Rust MSVC is not installed)
podman build -t saas-erp/kernel:latest ./kernel
podman build -t saas-erp/finance:latest ./plugins/finance

# 3. Load into cluster (if using kind/minikube) or push to registry
# kind: kind load docker-image saas-erp/kernel:latest saas-erp/finance:latest

# 4. Deploy Kernel and Finance, then Ingress (order matters for DNS)
kubectl apply -f infrastructure/k8s/kernel-deployment.yaml
kubectl apply -f infrastructure/k8s/finance-deployment.yaml
kubectl apply -f infrastructure/k8s/ingress.yaml
```

**Note:** Ingress host `*.saas-erp.com` is controller-specific (e.g. Nginx Ingress supports it). For local dev, use a single host or edit `ingress.yaml` to match your domain.

## API-First Design

All APIs are REST (and optionally gRPC internally). The same endpoints are consumed by web, Android, iOS, and Windows clients via the single Kernel gateway.

## Tenant context (X-Tenant-ID)

- **Kernel** resolves tenant from `X-Tenant-ID` header or from subdomain (e.g. `acme.saas-erp.com` → `acme`), then sets/overwrites `X-Tenant-ID` on every proxied request.
- **Plugins** (e.g. finance) read `X-Tenant-ID` and use it to scope data (e.g. schema per tenant or `WHERE tenant_id = ?`). The finance plugin’s `/invoice` response includes `tenant_id` to show the context in use.
