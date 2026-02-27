-- =============================================================
-- Migration: Enable RLS on all tenant-scoped tables
-- =============================================================
-- NOTE: We use ENABLE (not FORCE) so that the table owner (app_user)
-- can bypass RLS for service-level operations. RLS will apply to
-- any other roles that access these tables directly.

-- ── Core tables ──
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tenant_users
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON wallets
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- ── RBAC tables ──
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON roles
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- ── Subscription tables ──
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tenant_subscriptions
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE tenant_plugin_addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tenant_plugin_addons
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- ── School plugin tables ──
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON staff
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON students
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE staff_class_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON staff_class_assignments
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE attendance_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON attendance_log
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

ALTER TABLE fee_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON fee_invoices
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid);
