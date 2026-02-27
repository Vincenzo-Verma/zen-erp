# SaaS ERP - Oracle Cloud (OKE) Deployment Guide

Complete guide for deploying the SaaS ERP platform to Oracle Kubernetes Engine (OKE) with GitHub Actions CI/CD, Cloudflare DDoS protection, and SSL on a Hostinger domain.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Oracle Cloud Infrastructure Setup](#3-oracle-cloud-infrastructure-setup)
4. [Container Registry Setup](#4-container-registry-setup)
5. [Dockerfiles for All Services](#5-dockerfiles-for-all-services)
6. [Kubernetes Manifests](#6-kubernetes-manifests)
7. [GitHub Actions CI/CD Pipeline](#7-github-actions-cicd-pipeline)
8. [Domain Setup (Hostinger)](#8-domain-setup-hostinger)
9. [Cloudflare DDoS Protection and SSL](#9-cloudflare-ddos-protection-and-ssl)
10. [Post-Deployment Verification](#10-post-deployment-verification)
11. [Maintenance and Operations](#11-maintenance-and-operations)

---

## 1. Architecture Overview

```
                         Internet
                            |
                     ┌──────▼──────┐
                     │  Cloudflare  │  DDoS Protection + SSL Termination
                     │  (Proxy)     │  DNS for yourdomain.com
                     └──────┬──────┘
                            │  HTTPS (Cloudflare → Origin)
                            │
              ┌─────────────▼─────────────┐
              │  Oracle Cloud (OKE Cluster)│
              │                           │
              │  ┌─────────────────────┐  │
              │  │  Nginx Ingress      │  │  LoadBalancer (OCI LB)
              │  │  Controller         │  │
              │  └──────────┬──────────┘  │
              │             │             │
              │  ┌──────────▼──────────┐  │
              │  │  Gateway (8080)     │  │  REST → gRPC orchestrator
              │  └──┬──┬──┬──┬────────┘  │
              │     │  │  │  │           │
              │  ┌──▼┐┌▼─┐┌▼─┐┌────▼──┐  │
              │  │Auth││Te││Bi││School  │  │  gRPC microservices
              │  │5052││na││ll││Plugin  │  │
              │  │    ││nc││in││ 50060  │  │
              │  │    ││y ││g │└────────┘  │
              │  │    ││53││54│           │
              │  └────┘└──┘└──┘           │
              │         │                 │
              │  ┌──────▼──────┐          │
              │  │ PostgreSQL  │  OCI DB  │
              │  │    5432     │  System  │
              │  └─────────────┘          │
              │  ┌─────────────┐          │
              │  │    NATS     │          │
              │  │    4222     │          │
              │  └─────────────┘          │
              └───────────────────────────┘
```

### Services and Ports

| Service | Binary | Port | Protocol |
|---------|--------|------|----------|
| Gateway | `gateway` | 8080 | HTTP/REST |
| Auth | `auth-service` | 50052 | gRPC |
| Tenancy | `tenancy-service` | 50053 | gRPC |
| Billing | `billing-service` | 50054 | gRPC |
| School Plugin | `school-service` | 50060 | gRPC |
| Health Check | `health-check` | 50051 | gRPC |
| PostgreSQL | - | 5432 | TCP |
| NATS JetStream | - | 4222 | TCP |
| Frontend | Static (Nginx) | 80 | HTTP |

---

## 2. Prerequisites

### Local Machine

```bash
# OCI CLI
curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh | bash
oci setup config

# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl && sudo mv kubectl /usr/local/bin/

# Helm (for Nginx Ingress Controller)
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Docker (for building images locally if needed)
sudo dnf install docker   # Fedora
sudo systemctl enable --now docker
```

### Accounts Required

- **Oracle Cloud** - Free tier or paid (OKE cluster)
- **GitHub** - Repository with Actions enabled
- **Cloudflare** - Free plan is sufficient
- **Hostinger** - Domain purchased

---

## 3. Oracle Cloud Infrastructure Setup

### 3.1 Create a Compartment

```bash
oci iam compartment create \
  --name "saas-erp" \
  --description "SaaS ERP Production" \
  --compartment-id <your-tenancy-ocid>
```

Save the compartment OCID for later use.

### 3.2 Create a VCN (Virtual Cloud Network)

Use the OCI Console:
1. Go to **Networking > Virtual Cloud Networks**
2. Click **Start VCN Wizard** > **Create VCN with Internet Connectivity**
3. Name: `saas-erp-vcn`
4. CIDR: `10.0.0.0/16`
5. Create public subnet (`10.0.0.0/24`) and private subnet (`10.0.1.0/24`)

### 3.3 Create OKE Cluster

```bash
# Via OCI Console (recommended for first setup):
# 1. Go to Developer Services > Kubernetes Clusters (OKE)
# 2. Click "Create Cluster" > "Quick Create"
# 3. Settings:
#    - Name: saas-erp-cluster
#    - Kubernetes Version: v1.28 or latest
#    - Visibility: Public endpoint
#    - Shape: VM.Standard.A1.Flex (ARM — free tier eligible)
#    - OCPUs: 2, Memory: 12 GB  (per node)
#    - Nodes: 2 (minimum for HA)
#    - Node image: Oracle Linux 8
```

### 3.4 Configure kubectl

```bash
# Generate kubeconfig
oci ce cluster create-kubeconfig \
  --cluster-id <cluster-ocid> \
  --file $HOME/.kube/config \
  --region <your-region> \
  --token-version 2.0.0 \
  --kube-endpoint PUBLIC_ENDPOINT

# Verify
kubectl get nodes
```

### 3.5 Create PostgreSQL Database

**Option A: OCI Autonomous Database (Managed)**

Use OCI Console > Oracle Database > Autonomous Database (ATP):
- Workload: Transaction Processing
- Deployment: Serverless
- OCPU: 1, Storage: 20 GB (Always Free eligible)

**Option B: PostgreSQL in the Cluster (for cost savings)**

We'll use this approach in the manifests below — deploy PostgreSQL as a StatefulSet inside the cluster.

### 3.6 Create OCIR (Oracle Container Image Registry) Repository

```bash
# Log in to OCIR
docker login <region-key>.ocir.io -u '<tenancy-namespace>/<username>'

# Region key examples: iad (Ashburn), phx (Phoenix), lhr (London), bom (Mumbai)
# The password is an Auth Token generated from OCI Console > User Settings > Auth Tokens
```

---

## 4. Container Registry Setup

### 4.1 Create Auth Token for OCIR

1. OCI Console > **Identity & Security** > **Users** > your user
2. **Auth Tokens** > **Generate Token**
3. Save the token securely — you'll need it for GitHub Actions

### 4.2 Create Repositories

```bash
# Repositories are auto-created on first push, but you can pre-create them:
# OCI Console > Developer Services > Container Registry
# Create repositories:
#   saas-erp/gateway
#   saas-erp/auth-service
#   saas-erp/tenancy-service
#   saas-erp/billing-service
#   saas-erp/school-service
#   saas-erp/health-check
#   saas-erp/frontend
```

### 4.3 Create Kubernetes Image Pull Secret

```bash
kubectl create namespace saas-erp

kubectl create secret docker-registry ocir-secret \
  --namespace saas-erp \
  --docker-server=<region-key>.ocir.io \
  --docker-username='<tenancy-namespace>/<username>' \
  --docker-password='<auth-token>' \
  --docker-email='<your-email>'
```

---

## 5. Dockerfiles for All Services

### 5.1 Multi-stage Rust Dockerfile (All Backend Services)

Create `Dockerfile` at the project root:

```dockerfile
# ============================================================
# Stage 1: Build all Rust binaries
# ============================================================
FROM rust:1.83-bookworm AS builder

# Install protobuf compiler (required for tonic-build)
RUN apt-get update && apt-get install -y protobuf-compiler && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace manifests first for dependency caching
COPY Cargo.toml Cargo.lock ./
COPY libs/ libs/
COPY core/ core/
COPY bin/ bin/
COPY plugins/ plugins/
COPY migrations/ migrations/

# Build all workspace binaries in release mode
RUN cargo build --release

# ============================================================
# Stage 2: Minimal runtime image
# ============================================================
FROM debian:bookworm-slim AS runtime

RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy migrations for runtime execution
COPY --from=builder /app/migrations /app/migrations

WORKDIR /app
```

### 5.2 Per-Service Dockerfiles

Create `deploy/docker/` directory with individual Dockerfiles:

**`deploy/docker/Dockerfile.gateway`**
```dockerfile
FROM rust:1.83-bookworm AS builder
RUN apt-get update && apt-get install -y protobuf-compiler && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY libs/ libs/
COPY core/ core/
COPY bin/ bin/
COPY plugins/ plugins/
COPY migrations/ migrations/
RUN cargo build --release --bin gateway

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/gateway /usr/local/bin/gateway
COPY --from=builder /app/migrations /app/migrations
WORKDIR /app
EXPOSE 8080
CMD ["gateway"]
```

**`deploy/docker/Dockerfile.auth`**
```dockerfile
FROM rust:1.83-bookworm AS builder
RUN apt-get update && apt-get install -y protobuf-compiler && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY libs/ libs/
COPY core/ core/
COPY bin/ bin/
COPY plugins/ plugins/
COPY migrations/ migrations/
RUN cargo build --release --bin auth-service

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/auth-service /usr/local/bin/auth-service
COPY --from=builder /app/migrations /app/migrations
WORKDIR /app
EXPOSE 50052
CMD ["auth-service"]
```

**`deploy/docker/Dockerfile.tenancy`**
```dockerfile
FROM rust:1.83-bookworm AS builder
RUN apt-get update && apt-get install -y protobuf-compiler && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY libs/ libs/
COPY core/ core/
COPY bin/ bin/
COPY plugins/ plugins/
COPY migrations/ migrations/
RUN cargo build --release --bin tenancy-service

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/tenancy-service /usr/local/bin/tenancy-service
COPY --from=builder /app/migrations /app/migrations
WORKDIR /app
EXPOSE 50053
CMD ["tenancy-service"]
```

**`deploy/docker/Dockerfile.billing`**
```dockerfile
FROM rust:1.83-bookworm AS builder
RUN apt-get update && apt-get install -y protobuf-compiler && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY libs/ libs/
COPY core/ core/
COPY bin/ bin/
COPY plugins/ plugins/
COPY migrations/ migrations/
RUN cargo build --release --bin billing-service

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/billing-service /usr/local/bin/billing-service
COPY --from=builder /app/migrations /app/migrations
WORKDIR /app
EXPOSE 50054
CMD ["billing-service"]
```

**`deploy/docker/Dockerfile.school`**
```dockerfile
FROM rust:1.83-bookworm AS builder
RUN apt-get update && apt-get install -y protobuf-compiler && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY libs/ libs/
COPY core/ core/
COPY bin/ bin/
COPY plugins/ plugins/
COPY migrations/ migrations/
RUN cargo build --release --bin school-service

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/school-service /usr/local/bin/school-service
COPY --from=builder /app/migrations /app/migrations
WORKDIR /app
EXPOSE 50060
CMD ["school-service"]
```

**`deploy/docker/Dockerfile.health`**
```dockerfile
FROM rust:1.83-bookworm AS builder
RUN apt-get update && apt-get install -y protobuf-compiler && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY libs/ libs/
COPY core/ core/
COPY bin/ bin/
COPY plugins/ plugins/
COPY migrations/ migrations/
RUN cargo build --release --bin health-check

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/health-check /usr/local/bin/health-check
WORKDIR /app
EXPOSE 50051
CMD ["health-check"]
```

**`deploy/docker/Dockerfile.frontend`**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 5.3 Nginx Config for Frontend

Create `deploy/nginx/default.conf`:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback — serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API calls to the gateway service (inside K8s)
    location /api/ {
        proxy_pass http://gateway-service:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_for_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://gateway-service:8080;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 5.4 Docker .dockerignore

Create `.dockerignore` at the project root:

```
target/
frontend/node_modules/
frontend/dist/
.git/
.env
*.md
.github/
infrastructure/
```

---

## 6. Kubernetes Manifests

Create all manifests in `deploy/k8s/`.

### 6.1 Namespace

**`deploy/k8s/00-namespace.yaml`**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: saas-erp
  labels:
    app.kubernetes.io/name: saas-erp
```

### 6.2 Secrets

**`deploy/k8s/01-secrets.yaml`** (template — actual values injected by CI/CD)
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: erp-secrets
  namespace: saas-erp
type: Opaque
stringData:
  DATABASE_URL: "postgres://app_user:CHANGE_ME@postgres-service:5432/saas_erp"
  JWT_SECRET: "CHANGE_ME_TO_A_STRONG_RANDOM_SECRET"
  NATS_URL: "nats://nats-service:4222"
```

### 6.3 PostgreSQL StatefulSet

**`deploy/k8s/02-postgres.yaml`**
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: saas-erp
spec:
  accessModes: [ReadWriteOnce]
  storageClassName: oci-bv  # OCI Block Volume storage class
  resources:
    requests:
      storage: 50Gi
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: saas-erp
spec:
  serviceName: postgres-service
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16-alpine
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_DB
              value: saas_erp
            - name: POSTGRES_USER
              value: postgres
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: erp-secrets
                  key: POSTGRES_PASSWORD
          volumeMounts:
            - name: postgres-data
              mountPath: /var/lib/postgresql/data
            - name: init-scripts
              mountPath: /docker-entrypoint-initdb.d
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "1000m"
          livenessProbe:
            exec:
              command: ["pg_isready", "-U", "postgres"]
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            exec:
              command: ["pg_isready", "-U", "postgres"]
            initialDelaySeconds: 5
            periodSeconds: 5
      volumes:
        - name: postgres-data
          persistentVolumeClaim:
            claimName: postgres-pvc
        - name: init-scripts
          configMap:
            name: postgres-init
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
  namespace: saas-erp
spec:
  type: ClusterIP
  ports:
    - port: 5432
      targetPort: 5432
  selector:
    app: postgres
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-init
  namespace: saas-erp
data:
  init-db.sql: |
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
            CREATE ROLE app_user WITH LOGIN PASSWORD 'CHANGE_ME';
        END IF;
    END
    $$;
    GRANT CONNECT ON DATABASE saas_erp TO app_user;
    GRANT USAGE ON SCHEMA public TO app_user;
    GRANT CREATE ON SCHEMA public TO app_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
        GRANT USAGE, SELECT ON SEQUENCES TO app_user;
```

### 6.4 NATS

**`deploy/k8s/03-nats.yaml`**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nats
  namespace: saas-erp
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nats
  template:
    metadata:
      labels:
        app: nats
    spec:
      containers:
        - name: nats
          image: nats:2-alpine
          command: ["nats-server", "--jetstream", "--store_dir", "/data"]
          ports:
            - containerPort: 4222
              name: client
            - containerPort: 8222
              name: monitoring
          volumeMounts:
            - name: nats-data
              mountPath: /data
          resources:
            requests:
              memory: "64Mi"
              cpu: "50m"
            limits:
              memory: "256Mi"
              cpu: "500m"
      volumes:
        - name: nats-data
          emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: nats-service
  namespace: saas-erp
spec:
  type: ClusterIP
  ports:
    - port: 4222
      targetPort: 4222
      name: client
    - port: 8222
      targetPort: 8222
      name: monitoring
  selector:
    app: nats
```

### 6.5 Backend Services

**`deploy/k8s/04-backend.yaml`**
```yaml
# ── Auth Service ──
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: saas-erp
spec:
  replicas: 2
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      imagePullSecrets:
        - name: ocir-secret
      containers:
        - name: auth-service
          image: REGISTRY/saas-erp/auth-service:latest
          ports:
            - containerPort: 50052
          envFrom:
            - secretRef:
                name: erp-secrets
          env:
            - name: AUTH_SERVICE_PORT
              value: "50052"
            - name: RUST_LOG
              value: "info"
          resources:
            requests: { memory: "64Mi", cpu: "50m" }
            limits:   { memory: "256Mi", cpu: "500m" }
---
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: saas-erp
spec:
  type: ClusterIP
  ports:
    - port: 50052
      targetPort: 50052
  selector:
    app: auth-service
---
# ── Tenancy Service ──
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tenancy-service
  namespace: saas-erp
spec:
  replicas: 2
  selector:
    matchLabels:
      app: tenancy-service
  template:
    metadata:
      labels:
        app: tenancy-service
    spec:
      imagePullSecrets:
        - name: ocir-secret
      containers:
        - name: tenancy-service
          image: REGISTRY/saas-erp/tenancy-service:latest
          ports:
            - containerPort: 50053
          envFrom:
            - secretRef:
                name: erp-secrets
          env:
            - name: TENANCY_SERVICE_PORT
              value: "50053"
            - name: RUST_LOG
              value: "info"
          resources:
            requests: { memory: "64Mi", cpu: "50m" }
            limits:   { memory: "256Mi", cpu: "500m" }
---
apiVersion: v1
kind: Service
metadata:
  name: tenancy-service
  namespace: saas-erp
spec:
  type: ClusterIP
  ports:
    - port: 50053
      targetPort: 50053
  selector:
    app: tenancy-service
---
# ── Billing Service ──
apiVersion: apps/v1
kind: Deployment
metadata:
  name: billing-service
  namespace: saas-erp
spec:
  replicas: 2
  selector:
    matchLabels:
      app: billing-service
  template:
    metadata:
      labels:
        app: billing-service
    spec:
      imagePullSecrets:
        - name: ocir-secret
      containers:
        - name: billing-service
          image: REGISTRY/saas-erp/billing-service:latest
          ports:
            - containerPort: 50054
          envFrom:
            - secretRef:
                name: erp-secrets
          env:
            - name: BILLING_SERVICE_PORT
              value: "50054"
            - name: RUST_LOG
              value: "info"
          resources:
            requests: { memory: "64Mi", cpu: "50m" }
            limits:   { memory: "256Mi", cpu: "500m" }
---
apiVersion: v1
kind: Service
metadata:
  name: billing-service
  namespace: saas-erp
spec:
  type: ClusterIP
  ports:
    - port: 50054
      targetPort: 50054
  selector:
    app: billing-service
---
# ── School Plugin ──
apiVersion: apps/v1
kind: Deployment
metadata:
  name: school-service
  namespace: saas-erp
spec:
  replicas: 2
  selector:
    matchLabels:
      app: school-service
  template:
    metadata:
      labels:
        app: school-service
    spec:
      imagePullSecrets:
        - name: ocir-secret
      containers:
        - name: school-service
          image: REGISTRY/saas-erp/school-service:latest
          ports:
            - containerPort: 50060
          envFrom:
            - secretRef:
                name: erp-secrets
          env:
            - name: SCHOOL_SERVICE_PORT
              value: "50060"
            - name: RUST_LOG
              value: "info"
          resources:
            requests: { memory: "64Mi", cpu: "50m" }
            limits:   { memory: "256Mi", cpu: "500m" }
---
apiVersion: v1
kind: Service
metadata:
  name: school-service
  namespace: saas-erp
spec:
  type: ClusterIP
  ports:
    - port: 50060
      targetPort: 50060
  selector:
    app: school-service
---
# ── Health Check ──
apiVersion: apps/v1
kind: Deployment
metadata:
  name: health-check
  namespace: saas-erp
spec:
  replicas: 1
  selector:
    matchLabels:
      app: health-check
  template:
    metadata:
      labels:
        app: health-check
    spec:
      imagePullSecrets:
        - name: ocir-secret
      containers:
        - name: health-check
          image: REGISTRY/saas-erp/health-check:latest
          ports:
            - containerPort: 50051
          env:
            - name: HEALTH_CHECK_PORT
              value: "50051"
          resources:
            requests: { memory: "32Mi", cpu: "25m" }
            limits:   { memory: "128Mi", cpu: "250m" }
---
apiVersion: v1
kind: Service
metadata:
  name: health-check-service
  namespace: saas-erp
spec:
  type: ClusterIP
  ports:
    - port: 50051
      targetPort: 50051
  selector:
    app: health-check
```

### 6.6 Gateway

**`deploy/k8s/05-gateway.yaml`**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gateway
  namespace: saas-erp
spec:
  replicas: 2
  selector:
    matchLabels:
      app: gateway
  template:
    metadata:
      labels:
        app: gateway
    spec:
      imagePullSecrets:
        - name: ocir-secret
      containers:
        - name: gateway
          image: REGISTRY/saas-erp/gateway:latest
          ports:
            - containerPort: 8080
          envFrom:
            - secretRef:
                name: erp-secrets
          env:
            - name: GATEWAY_PORT
              value: "8080"
            - name: AUTH_SERVICE_ADDR
              value: "http://auth-service:50052"
            - name: TENANCY_SERVICE_ADDR
              value: "http://tenancy-service:50053"
            - name: BILLING_SERVICE_ADDR
              value: "http://billing-service:50054"
            - name: SCHOOL_SERVICE_ADDR
              value: "http://school-service:50060"
            - name: RUST_LOG
              value: "info"
          resources:
            requests: { memory: "64Mi", cpu: "50m" }
            limits:   { memory: "256Mi", cpu: "500m" }
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: gateway-service
  namespace: saas-erp
spec:
  type: ClusterIP
  ports:
    - port: 8080
      targetPort: 8080
  selector:
    app: gateway
```

### 6.7 Frontend

**`deploy/k8s/06-frontend.yaml`**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: saas-erp
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      imagePullSecrets:
        - name: ocir-secret
      containers:
        - name: frontend
          image: REGISTRY/saas-erp/frontend:latest
          ports:
            - containerPort: 80
          resources:
            requests: { memory: "32Mi", cpu: "25m" }
            limits:   { memory: "128Mi", cpu: "250m" }
          livenessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: saas-erp
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: 80
  selector:
    app: frontend
```

### 6.8 Ingress

**`deploy/k8s/07-ingress.yaml`**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: saas-erp-ingress
  namespace: saas-erp
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "60"
    # Real IP from Cloudflare
    nginx.ingress.kubernetes.io/use-forwarded-headers: "true"
    nginx.ingress.kubernetes.io/compute-full-forwarded-for: "true"
spec:
  ingressClassName: nginx
  rules:
    # Main domain — frontend + API
    - host: yourdomain.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: gateway-service
                port:
                  number: 8080
          - path: /health
            pathType: Prefix
            backend:
              service:
                name: gateway-service
                port:
                  number: 8080
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 80
    # Wildcard subdomains — same routing
    - host: "*.yourdomain.com"
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: gateway-service
                port:
                  number: 8080
          - path: /health
            pathType: Prefix
            backend:
              service:
                name: gateway-service
                port:
                  number: 8080
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 80
```

### 6.9 Install Nginx Ingress Controller

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer \
  --set controller.service.annotations."oci\.oraclecloud\.com/load-balancer-type"="lb" \
  --set controller.config.use-forwarded-headers="true" \
  --set controller.config.proxy-real-ip-cidr="173.245.48.0/20\,103.21.244.0/22\,103.22.200.0/22\,103.31.4.0/22\,141.101.64.0/18\,108.162.192.0/18\,190.93.240.0/20\,188.114.96.0/20\,197.234.240.0/22\,198.41.128.0/17\,162.158.0.0/15\,104.16.0.0/13\,104.24.0.0/14\,172.64.0.0/13\,131.0.72.0/22"
```

After deploying, get the Load Balancer public IP:

```bash
kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

Save this IP — you'll need it for Cloudflare DNS.

---

## 7. GitHub Actions CI/CD Pipeline

### 7.1 Add GitHub Secrets

Go to your GitHub repo > **Settings** > **Secrets and variables** > **Actions** and add:

| Secret Name | Value |
|---|---|
| `OCI_REGION` | e.g., `ap-mumbai-1` |
| `OCI_TENANCY_NAMESPACE` | Your OCI tenancy namespace |
| `OCIR_USERNAME` | `<tenancy-namespace>/<username>` |
| `OCIR_TOKEN` | Auth token from OCI |
| `OKE_CLUSTER_OCID` | Cluster OCID |
| `OCI_CLI_USER` | User OCID |
| `OCI_CLI_TENANCY` | Tenancy OCID |
| `OCI_CLI_FINGERPRINT` | API key fingerprint |
| `OCI_CLI_KEY_CONTENT` | Full PEM private key content |
| `DATABASE_URL` | Production PostgreSQL URL |
| `JWT_SECRET` | Strong random secret for production |
| `NATS_URL` | `nats://nats-service:4222` |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `APP_USER_PASSWORD` | `app_user` PostgreSQL password |

### 7.2 CI/CD Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Build & Deploy to OKE

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  OCI_REGION: ${{ secrets.OCI_REGION }}
  REGISTRY: ${{ secrets.OCI_REGION }}.ocir.io/${{ secrets.OCI_TENANCY_NAMESPACE }}

jobs:
  # ──────────────────────────────────────────────
  # Job 1: Build and push all Docker images
  # ──────────────────────────────────────────────
  build:
    name: Build & Push Images
    runs-on: ubuntu-latest
    strategy:
      matrix:
        include:
          - service: gateway
            dockerfile: deploy/docker/Dockerfile.gateway
          - service: auth-service
            dockerfile: deploy/docker/Dockerfile.auth
          - service: tenancy-service
            dockerfile: deploy/docker/Dockerfile.tenancy
          - service: billing-service
            dockerfile: deploy/docker/Dockerfile.billing
          - service: school-service
            dockerfile: deploy/docker/Dockerfile.school
          - service: health-check
            dockerfile: deploy/docker/Dockerfile.health
          - service: frontend
            dockerfile: deploy/docker/Dockerfile.frontend

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Log in to OCIR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.OCI_REGION }}.ocir.io
          username: ${{ secrets.OCIR_USERNAME }}
          password: ${{ secrets.OCIR_TOKEN }}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build and push ${{ matrix.service }}
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ${{ matrix.dockerfile }}
          push: true
          tags: |
            ${{ env.REGISTRY }}/saas-erp/${{ matrix.service }}:${{ github.sha }}
            ${{ env.REGISTRY }}/saas-erp/${{ matrix.service }}:latest
          cache-from: type=gha,scope=${{ matrix.service }}
          cache-to: type=gha,mode=max,scope=${{ matrix.service }}

  # ──────────────────────────────────────────────
  # Job 2: Deploy to OKE
  # ──────────────────────────────────────────────
  deploy:
    name: Deploy to OKE
    needs: build
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure OCI CLI
        uses: oracle-actions/configure-kubectl-oke@v1.5.1
        with:
          cluster: ${{ secrets.OKE_CLUSTER_OCID }}
          region: ${{ secrets.OCI_REGION }}
        env:
          OCI_CLI_USER: ${{ secrets.OCI_CLI_USER }}
          OCI_CLI_TENANCY: ${{ secrets.OCI_CLI_TENANCY }}
          OCI_CLI_FINGERPRINT: ${{ secrets.OCI_CLI_FINGERPRINT }}
          OCI_CLI_KEY_CONTENT: ${{ secrets.OCI_CLI_KEY_CONTENT }}
          OCI_CLI_REGION: ${{ secrets.OCI_REGION }}

      - name: Create/update namespace
        run: kubectl apply -f deploy/k8s/00-namespace.yaml

      - name: Update secrets
        run: |
          kubectl create secret generic erp-secrets \
            --namespace saas-erp \
            --from-literal=DATABASE_URL="${{ secrets.DATABASE_URL }}" \
            --from-literal=JWT_SECRET="${{ secrets.JWT_SECRET }}" \
            --from-literal=NATS_URL="${{ secrets.NATS_URL }}" \
            --from-literal=POSTGRES_PASSWORD="${{ secrets.POSTGRES_PASSWORD }}" \
            --dry-run=client -o yaml | kubectl apply -f -

      - name: Replace image registry in manifests
        run: |
          sed -i "s|REGISTRY|${{ env.REGISTRY }}|g" deploy/k8s/04-backend.yaml
          sed -i "s|REGISTRY|${{ env.REGISTRY }}|g" deploy/k8s/05-gateway.yaml
          sed -i "s|REGISTRY|${{ env.REGISTRY }}|g" deploy/k8s/06-frontend.yaml

      - name: Deploy infrastructure (Postgres + NATS)
        run: |
          kubectl apply -f deploy/k8s/02-postgres.yaml
          kubectl apply -f deploy/k8s/03-nats.yaml

      - name: Wait for Postgres to be ready
        run: |
          kubectl rollout status statefulset/postgres -n saas-erp --timeout=120s

      - name: Deploy backend services
        run: |
          kubectl apply -f deploy/k8s/04-backend.yaml

      - name: Deploy gateway
        run: |
          kubectl apply -f deploy/k8s/05-gateway.yaml

      - name: Deploy frontend
        run: |
          kubectl apply -f deploy/k8s/06-frontend.yaml

      - name: Deploy ingress
        run: |
          kubectl apply -f deploy/k8s/07-ingress.yaml

      - name: Restart deployments with new images
        run: |
          kubectl rollout restart deployment/auth-service -n saas-erp
          kubectl rollout restart deployment/tenancy-service -n saas-erp
          kubectl rollout restart deployment/billing-service -n saas-erp
          kubectl rollout restart deployment/school-service -n saas-erp
          kubectl rollout restart deployment/health-check -n saas-erp
          kubectl rollout restart deployment/gateway -n saas-erp
          kubectl rollout restart deployment/frontend -n saas-erp

      - name: Wait for rollout to complete
        run: |
          kubectl rollout status deployment/gateway -n saas-erp --timeout=180s
          kubectl rollout status deployment/frontend -n saas-erp --timeout=180s

      - name: Verify deployment
        run: |
          echo "=== Pod Status ==="
          kubectl get pods -n saas-erp
          echo ""
          echo "=== Services ==="
          kubectl get svc -n saas-erp
```

### 7.3 (Optional) TypeScript Check Workflow

Create `.github/workflows/check.yml` for PR validation:

```yaml
name: CI Check

on:
  pull_request:
    branches: [main]

jobs:
  rust-check:
    name: Rust Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - run: sudo apt-get update && sudo apt-get install -y protobuf-compiler
      - uses: Swatinem/rust-cache@v2
      - run: cargo check --workspace

  frontend-check:
    name: Frontend Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: cd frontend && npm ci
      - run: cd frontend && npx tsc --noEmit
      - run: cd frontend && npm run build
```

---

## 8. Domain Setup (Hostinger)

### 8.1 Change Nameservers to Cloudflare

1. Log in to **Hostinger** > **Domains** > select your domain
2. Go to **DNS / Nameservers**
3. Click **Change Nameservers** (switch to custom)
4. Enter Cloudflare nameservers (you'll get these in Step 9):
   ```
   NS1: ada.ns.cloudflare.com    (example — Cloudflare assigns unique ones)
   NS2: bob.ns.cloudflare.com
   ```
5. Save. Propagation takes up to 24-48 hours (usually faster).

### 8.2 Verify Nameserver Change

```bash
dig yourdomain.com NS +short
# Should show cloudflare nameservers after propagation
```

---

## 9. Cloudflare DDoS Protection and SSL

### 9.1 Add Site to Cloudflare

1. Sign up / log in at [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click **Add a Site** > enter `yourdomain.com`
3. Select the **Free** plan
4. Cloudflare will scan existing DNS records
5. Note the assigned nameservers — enter these at Hostinger (Step 8)

### 9.2 Configure DNS Records

In Cloudflare DNS settings, add these records pointing to your **OKE Load Balancer IP** (from Section 6.9):

| Type | Name | Content | Proxy | TTL |
|------|------|---------|-------|-----|
| A | `@` | `<OKE-LB-IP>` | Proxied (orange cloud) | Auto |
| A | `*` | `<OKE-LB-IP>` | Proxied (orange cloud) | Auto |
| A | `www` | `<OKE-LB-IP>` | Proxied (orange cloud) | Auto |

The **orange cloud (Proxied)** is critical — this routes traffic through Cloudflare for DDoS protection.

### 9.3 SSL/TLS Configuration

Go to **SSL/TLS** in Cloudflare dashboard:

1. **Overview** > Set encryption mode to **Full (Strict)**
   - This encrypts traffic between Cloudflare and your origin server
   - "Full (Strict)" requires a valid certificate at the origin

2. **Edge Certificates** > Enable:
   - **Always Use HTTPS**: ON
   - **Automatic HTTPS Rewrites**: ON
   - **Minimum TLS Version**: TLS 1.2
   - **TLS 1.3**: ON

3. **Origin Server** > Create an **Origin Certificate**:
   - Click **Create Certificate**
   - Hostnames: `yourdomain.com`, `*.yourdomain.com`
   - Validity: 15 years (Cloudflare origin certs are free)
   - Save the **certificate** and **private key**

### 9.4 Install Origin Certificate in Kubernetes

```bash
# Create TLS secret from the Cloudflare origin certificate
kubectl create secret tls cloudflare-origin-tls \
  --namespace saas-erp \
  --cert=origin-cert.pem \
  --key=origin-key.pem
```

Update the Ingress to use TLS (`deploy/k8s/07-ingress.yaml`), add under `spec`:

```yaml
  tls:
    - hosts:
        - yourdomain.com
        - "*.yourdomain.com"
      secretName: cloudflare-origin-tls
```

### 9.5 DDoS Protection Settings

Go to **Security** in Cloudflare:

1. **Settings**:
   - **Security Level**: Medium (or High if under attack)
   - **Challenge Passage**: 30 minutes
   - **Browser Integrity Check**: ON

2. **DDoS** > **HTTP DDoS attack protection**:
   - Sensitivity: High
   - Action: Block (or Managed Challenge)

3. **Bots**:
   - **Bot Fight Mode**: ON (Free plan)

4. **WAF** (Free plan includes managed rules):
   - Enable Cloudflare Managed Ruleset
   - Enable OWASP Core Ruleset

### 9.6 Firewall Rules (Recommended)

Go to **Security** > **WAF** > **Custom Rules**:

**Rule 1: Block non-Cloudflare traffic at OKE level**

On your OCI Security List / NSG, restrict the Load Balancer to only accept traffic from [Cloudflare's IP ranges](https://www.cloudflare.com/ips/):

```
# IPv4
173.245.48.0/20
103.21.244.0/22
103.22.200.0/22
103.31.4.0/22
141.101.64.0/18
108.162.192.0/18
190.93.240.0/20
188.114.96.0/20
197.234.240.0/22
198.41.128.0/17
162.158.0.0/15
104.16.0.0/13
104.24.0.0/14
172.64.0.0/13
131.0.72.0/22
```

This ensures attackers cannot bypass Cloudflare by hitting your origin IP directly.

### 9.7 Page Rules (Optional)

**Cache static assets aggressively:**

| URL Pattern | Setting |
|---|---|
| `yourdomain.com/assets/*` | Cache Level: Cache Everything, Edge TTL: 1 month |
| `yourdomain.com/api/*` | Cache Level: Bypass |

---

## 10. Post-Deployment Verification

### 10.1 Check All Pods

```bash
kubectl get pods -n saas-erp
# All pods should show Running status with READY 1/1

kubectl get svc -n saas-erp
# Verify all services are listed with correct ports
```

### 10.2 Check Logs

```bash
# Gateway logs
kubectl logs -n saas-erp -l app=gateway --tail=50

# Auth service logs
kubectl logs -n saas-erp -l app=auth-service --tail=50

# Check for database migration issues
kubectl logs -n saas-erp -l app=auth-service --tail=100 | grep -i migration
```

### 10.3 Test Endpoints

```bash
# Health check (through Cloudflare)
curl https://yourdomain.com/health

# API test
curl https://yourdomain.com/api/v1/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

### 10.4 Verify Cloudflare

```bash
# Check if Cloudflare headers are present
curl -I https://yourdomain.com
# Look for: cf-ray, cf-cache-status, server: cloudflare

# Verify SSL
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com < /dev/null 2>/dev/null | openssl x509 -noout -issuer
# Should show Cloudflare as issuer
```

---

## 11. Maintenance and Operations

### 11.1 Scaling

```bash
# Scale a specific service
kubectl scale deployment gateway -n saas-erp --replicas=3

# Set up Horizontal Pod Autoscaler
kubectl autoscale deployment gateway -n saas-erp \
  --min=2 --max=5 --cpu-percent=70
```

### 11.2 Rolling Updates

When you push to `main`, GitHub Actions automatically:
1. Builds new Docker images tagged with the commit SHA
2. Pushes to OCIR
3. Restarts deployments in OKE to pull the new images

### 11.3 Rollback

```bash
# View rollout history
kubectl rollout history deployment/gateway -n saas-erp

# Rollback to previous version
kubectl rollout undo deployment/gateway -n saas-erp

# Rollback to a specific revision
kubectl rollout undo deployment/gateway -n saas-erp --to-revision=2
```

### 11.4 Database Backup

```bash
# Manual backup
kubectl exec -n saas-erp postgres-0 -- \
  pg_dump -U postgres saas_erp > backup-$(date +%Y%m%d).sql

# Restore
kubectl exec -i -n saas-erp postgres-0 -- \
  psql -U postgres saas_erp < backup-20250227.sql
```

### 11.5 Monitoring

```bash
# Resource usage
kubectl top pods -n saas-erp
kubectl top nodes

# Events (useful for debugging)
kubectl get events -n saas-erp --sort-by='.lastTimestamp'
```

### 11.6 Cloudflare Under Attack Mode

If experiencing a DDoS attack:

1. Cloudflare Dashboard > **Overview** > **Under Attack Mode**: ON
2. This presents a JavaScript challenge to all visitors for 5 seconds
3. Turn it off once the attack subsides

---

## Quick Reference - Deployment Checklist

```
[ ] Oracle Cloud account + OKE cluster created
[ ] kubectl configured and can reach cluster
[ ] OCIR repositories created, auth token generated
[ ] GitHub secrets configured (all 12 secrets)
[ ] Nginx Ingress Controller installed via Helm
[ ] Hostinger nameservers changed to Cloudflare
[ ] Cloudflare site added, DNS records created (A records with proxy)
[ ] Cloudflare Origin Certificate created and installed as K8s secret
[ ] SSL mode set to Full (Strict)
[ ] Push to main branch → CI/CD builds and deploys automatically
[ ] curl https://yourdomain.com/health returns OK
[ ] OCI Security List restricted to Cloudflare IPs only
```
