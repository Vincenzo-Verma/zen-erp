# 2. User Stories and Acceptance Criteria

## 2.1 Epic: Tenancy & Authentication

### User Story 2.1.1: Multi-Org Sign Up
**As a** Business Owner,
**I want to** create multiple organizations under my single account,
**So that** I can manage my School and my Clinic from one dashboard.

**Acceptance Criteria:**
*   User can sign up with email/password or OAuth.
*   Upon login, User sees a "Select Organization" or "Create Organization" screen.
*   Dashboard clearly indicates which Organization is currently active.
*   Switching organizations does not require re-login.

### User Story 2.1.2: Data Isolation
**As a** School Administrator,
**I want to** ensure my student data is invisible to other schools,
**So that** I comply with privacy regulations.

**Acceptance Criteria:**
*   Database queries *must* fail if `tenant_id` is missing.
*   Penetration test confirms User A cannot fetch User B's records by manipulating IDs.
*   RLS policies are verified active on all sensitive tables.

## 2.2 Epic: Billing & Wallet

### User Story 2.2.1: Wallet Top-Up
**As an** Admin,
**I want to** add funds to my wallet,
**So that** my services continue without interruption.

**Acceptance Criteria:**
*   Integration with payment gateway (Stripe/Razorpay).
*   Wallet balance updates immediately after successful payment.
*   Transaction history log is visible.

### User Story 2.2.2: Auto-Suspension
**As a** System Platform,
**I want to** automatically suspend services when funds are depleted,
**So that** I don't incur infrastructure costs for non-paying users.

**Acceptance Criteria:**
*   "Billing Watchdog" runs periodically (or event-based) to check balances.
*   If Balance <= 0, `TenantSuspended` event is published.
*   All API requests for suspended tenant return `402 Payment Required`.
*   Admin receives an email notification.

## 2.3 Epic: Plugin System

### User Story 2.3.1: Install Plugin
**As an** Admin,
**I want to** install the "School Management" plugin,
**So that** I can access student attendance features.

**Acceptance Criteria:**
*   Marketplace lists available plugins.
*   "Install" action provisions necessary database tables/schemas for that tenant.
*   Plugin features appear in the sidebar immediately.

### User Story 2.3.2: RBAC Assignment
**As an** Admin,
**I want to** assign "Teacher" role to a user for the "School Plugin",
**So that** they can mark attendance but not edit fees.

**Acceptance Criteria:**
*   Admin can select a User and a Role.
*   Permissions are scoped to the specific Plugin and Tenant.
*   User sees only relevant menu items based on Role.
