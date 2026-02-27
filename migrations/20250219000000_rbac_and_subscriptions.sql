-- =============================================================
-- Migration: RBAC & Subscription System
-- =============================================================

-- ── RBAC ──────────────────────────────────────────────────────

-- Roles — per-tenant role definitions
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                 -- admin, teacher, student, parent, custom...
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false,  -- system roles can't be deleted
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, name)
);

-- Permissions — granular access controls
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource TEXT NOT NULL,             -- e.g. 'students', 'attendance', 'fees', 'staff'
    action TEXT NOT NULL,               -- e.g. 'read', 'write', 'delete', 'manage'
    description TEXT,
    UNIQUE (resource, action)
);

-- Role ↔ Permission mapping
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Tenant ↔ User mapping with role reference (replaces old tenant_users)
CREATE TABLE IF NOT EXISTS tenant_users (
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_users_user ON tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_role ON tenant_users(role_id);

-- ── PLUGIN REGISTRY ──────────────────────────────────────────

-- Master list of available plugins
CREATE TABLE IF NOT EXISTS plugins_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,          -- 'school', 'attendance', 'fees', 'gradebook', 'timetable'
    name TEXT NOT NULL,
    description TEXT,
    version TEXT NOT NULL DEFAULT '1.0.0',
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- ── SUBSCRIPTION & PLANS ─────────────────────────────────────

-- Plans (tier definitions)
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,          -- 'basic', 'pro', 'enterprise'
    price_monthly NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    max_users INT,                       -- null = unlimited
    max_students INT,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Which plugins are included in each plan
CREATE TABLE IF NOT EXISTS plan_plugins (
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    plugin_id UUID NOT NULL REFERENCES plugins_registry(id) ON DELETE CASCADE,
    PRIMARY KEY (plan_id, plugin_id)
);

-- Active subscription per tenant
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'expired', 'cancelled', 'trial')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    UNIQUE (tenant_id)
);

-- Extra plugins purchased beyond the plan
CREATE TABLE IF NOT EXISTS tenant_plugin_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plugin_id UUID NOT NULL REFERENCES plugins_registry(id) ON DELETE CASCADE,
    activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, plugin_id)
);

-- ── SEED DEFAULT PERMISSIONS ─────────────────────────────────

INSERT INTO permissions (id, resource, action, description) VALUES
    (gen_random_uuid(), 'students', 'read', 'View student records'),
    (gen_random_uuid(), 'students', 'write', 'Create/edit student records'),
    (gen_random_uuid(), 'students', 'delete', 'Delete student records'),
    (gen_random_uuid(), 'staff', 'read', 'View staff records'),
    (gen_random_uuid(), 'staff', 'write', 'Create/edit staff records'),
    (gen_random_uuid(), 'staff', 'delete', 'Delete staff records'),
    (gen_random_uuid(), 'attendance', 'read', 'View attendance'),
    (gen_random_uuid(), 'attendance', 'write', 'Mark/edit attendance'),
    (gen_random_uuid(), 'fees', 'read', 'View fee invoices'),
    (gen_random_uuid(), 'fees', 'write', 'Generate/edit invoices'),
    (gen_random_uuid(), 'fees', 'manage', 'Process payments and refunds'),
    (gen_random_uuid(), 'gradebook', 'read', 'View grades and reports'),
    (gen_random_uuid(), 'gradebook', 'write', 'Enter/edit grades'),
    (gen_random_uuid(), 'timetable', 'read', 'View timetable'),
    (gen_random_uuid(), 'timetable', 'write', 'Create/edit timetable'),
    (gen_random_uuid(), 'tenant', 'manage', 'Manage tenant settings'),
    (gen_random_uuid(), 'roles', 'manage', 'Create/edit/delete custom roles'),
    (gen_random_uuid(), 'billing', 'read', 'View wallet and billing'),
    (gen_random_uuid(), 'billing', 'manage', 'Top-up wallet, manage subscription'),
    (gen_random_uuid(), 'plugins', 'manage', 'Activate/deactivate plugins')
ON CONFLICT (resource, action) DO NOTHING;

-- ── SEED DEFAULT PLUGINS ─────────────────────────────────────

INSERT INTO plugins_registry (id, slug, name, description) VALUES
    (gen_random_uuid(), 'school', 'School Core', 'Student and staff management'),
    (gen_random_uuid(), 'attendance', 'Attendance', 'Daily attendance tracking'),
    (gen_random_uuid(), 'fees', 'Fee Management', 'Invoicing and payments'),
    (gen_random_uuid(), 'gradebook', 'Gradebook', 'Exams and report cards'),
    (gen_random_uuid(), 'timetable', 'Timetable', 'Class scheduling'),
    (gen_random_uuid(), 'transport', 'Transport', 'Fleet and route management')
ON CONFLICT (slug) DO NOTHING;

-- ── SEED DEFAULT PLANS ───────────────────────────────────────

INSERT INTO plans (id, name, price_monthly, max_users, max_students, description) VALUES
    (gen_random_uuid(), 'basic', 9.99, 50, 200, 'Basic plan: School core + Attendance'),
    (gen_random_uuid(), 'pro', 29.99, 200, 1000, 'Pro plan: All core plugins'),
    (gen_random_uuid(), 'enterprise', 99.99, NULL, NULL, 'Enterprise: Unlimited everything')
ON CONFLICT (name) DO NOTHING;
