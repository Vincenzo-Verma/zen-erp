-- =============================================================
-- SaaS ERP — Database Initialization Script
-- Runs once on first `docker compose up` via entrypoint.
-- =============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create the application user (non-superuser, for RLS enforcement)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
        CREATE ROLE app_user WITH LOGIN PASSWORD 'app_password';
    END IF;
END
$$;

-- Grant connect and usage rights
GRANT CONNECT ON DATABASE saas_erp TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;

-- app_user can CREATE tables (needed for sqlx migrations)
GRANT CREATE ON SCHEMA public TO app_user;

-- Default privileges: all future tables readable by app_user
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO app_user;
