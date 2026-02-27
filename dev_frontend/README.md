# Gateway API Documentation

This directory contains documentation for the exposed API Gateway routes, intended for frontend development consumption.

## Overview

The Gateway acts as the single entry point for all client requests. It aggregates calls to internal microservices (Auth, Tenancy, etc.) and exposes them via REST/JSON.

> [!NOTE]
> All payload and response bodies are JSON.

## Service Routes

### [Authentication](./auth.md)
- `POST /api/v1/auth/register` - Create a new user account.
- `POST /api/v1/auth/login` - Authenticate a user and receive a JWT.
- `POST /api/v1/auth/verify` - Verify a token (Debug/Internal).

### [Tenancy](./tenancy.md)
- `POST /api/v1/tenants` - Create a new tenant (Organization/Workspace).
- `GET /api/v1/tenants/:id` - Get details of a specific tenant.
- `GET /api/v1/tenants/user/:user_id` - List all tenants a user belongs to.
- `POST /api/v1/tenants/:id/users` - Add a user to a tenant with a specific role.

### [Health Checks](./health.md)
- `GET /health` - Simple liveness check.
- `GET /health/grpc` - Check connection to internal gRPC services.

> [!WARNING]
> **Missing Routes:**
> The following routes are planned but **NOT currently implemented** in the gateway:
> - Billing (`/api/v1/billing`)
> - Plugin Routes (e.g., `/api/v1/school/students`)
