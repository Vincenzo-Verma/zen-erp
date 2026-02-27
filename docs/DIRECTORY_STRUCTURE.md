# Project Directory Structure

```
saas-erp/
├── kernel/                          # Core orchestrator (Rust)
│   ├── src/
│   │   ├── main.rs                  # HTTP server entry, /health, /api/* routing
│   │   ├── middleware/
│   │   │   ├── mod.rs
│   │   │   └── tenant.rs            # Tenant-ID from header or subdomain
│   │   └── router/
│   │       ├── mod.rs
│   │       └── plugin_router.rs     # Dynamic proxy to plugin-service with X-Tenant-ID
│   ├── Cargo.toml
│   ├── Dockerfile
│   └── .dockerignore
│
├── plugins/
│   └── finance/                     # Finance plugin (Python)
│       ├── app/
│       │   ├── __init__.py
│       │   └── main.py              # FastAPI: /health, /invoice (reads X-Tenant-ID)
│       ├── requirements.txt
│       └── Dockerfile
│
├── infrastructure/
│   └── k8s/
│       ├── namespace.yaml           # saas-erp namespace
│       ├── ingress.yaml             # Nginx Ingress, *.saas-erp.com → kernel
│       ├── kernel-deployment.yaml   # Kernel Deployment + Service (kernel-service:8080)
│       └── finance-deployment.yaml  # Finance Deployment + Service (finance-service:80)
│
├── frontend/                        # API-first consumers (web; same API for mobile/desktop)
│   └── index.html                  # HTML + Tailwind + JS, calls /api/finance/invoice
│
├── docs/
│   └── DIRECTORY_STRUCTURE.md
│
└── README.md
```

## Tenant context flow

1. **Ingress** → forwards `*.saas-erp.com` to **Kernel**.
2. **Kernel** middleware resolves tenant from `X-Tenant-ID` header or subdomain, sets `X-Tenant-ID` on the request.
3. **Kernel** router maps `/api/finance/...` → `http://finance-service/...` and forwards the request (including `X-Tenant-ID`).
4. **Finance** (and other plugins) read `X-Tenant-ID` and use it for tenant-scoped data (e.g. schema or tenant column).
