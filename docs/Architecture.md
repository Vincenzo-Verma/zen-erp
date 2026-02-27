1. Architectural Overview
Philosophy: The Microkernel Approach
The system is built on a "Core + Plugins" model. The core system handles only the absolute essentials (Identity, Tenancy, Billing, Message Bus), while all business logic (School Management, Inventory, HR) exists as isolated, hot-pluggable plugins.

High-Level Diagram
Client Layer: Web/Mobile Apps (communicate via API Gateway).

API Gateway: Routes requests to the Core or specific Plugins. Handles SSL termination and rate limiting.

The Core (Kernel):

Tenant Manager: Handles onboarding, RLS policies, and subscription status (Active/Suspended).

Identity Provider (IdP): Centralized auth (OIDC/OAuth2).

Billing Engine: Tracks usage for pay-as-you-go; triggers "Auto-Cutoff" hooks.

Event Bus: A high-performance message broker (e.g., NATS/Kafka) for async communication between plugins.

Plugin Layer (gRPC Services):

Independent microservices written in Rust.

Examples: service-school-academics, service-hospital-opd, service-inventory.

They do not talk directly to each other; they emit events to the Core or other plugins via the Event Bus.

Data Layer:

Pooled Database: Single Postgres instance (or cluster).

Isolation: tenant_id column in every table + Postgres RLS policies to enforce strict data segregation at the database engine level.