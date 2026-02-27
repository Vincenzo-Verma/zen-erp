# 5. Database Schema

## 5.1 Overview
The database uses **PostgreSQL 16+** with **Row Level Security (RLS)** as the primary mechanism for multi-tenancy.
*   **Strategy**: "Shared Database, Shared Schema".
*   **Isolation**: Enforced by Postgres policies, not application logic.
*   **Connection**: All services connect as a specialized `app_user`, not `postgres` superuser.

## 5.2 Core Schema (Kernel)

### 5.2.1 `tenants` Table
Master registry of all organizations (Schools).
```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- partial domain (e.g., springfield)
    type TEXT DEFAULT 'school', -- school, clinic, etc.
    domain TEXT UNIQUE, -- custom domain (e.g., springfieldhigh.com)
    status TEXT DEFAULT 'active',
    plan_tier TEXT DEFAULT 'basic',
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### 5.2.2 `users` Table
Global user identities (Super Admins, Principals, Staff, Students).
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### 5.2.3 `tenant_users` (Join Table)
Maps users to schools with roles.
```sql
CREATE TABLE tenant_users (
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES users(id),
    role TEXT NOT NULL, -- super_admin, school_admin, teacher, student, parent
    PRIMARY KEY (tenant_id, user_id)
);
```

### 5.2.4 `wallets` Table
Financial state of a tenant (or Super Admin group).
```sql
CREATE TABLE wallets (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id),
    balance NUMERIC(10, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

## 5.3 Plugin Schema: School ERP
All plugin tables **MUST** have a `tenant_id` column.

### 5.3.1 `students` Table (Service: School)
```sql
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    admission_number TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    class_grade INT NOT NULL,
    section CHAR(1) NOT NULL,
    parent_email TEXT,
    ...
);
CREATE UNIQUE INDEX idx_students_admission ON students(tenant_id, admission_number);
```

### 5.3.2 `attendance_log` Table (Service: Attendance)
```sql
CREATE TABLE attendance_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    student_id UUID REFERENCES students(id),
    date DATE NOT NULL,
    status TEXT NOT NULL, -- PRESENT, ABSENT, LATE, LEAVE
    remarks TEXT
);
CREATE INDEX idx_attendance_composite ON attendance_log(tenant_id, date, student_id);
```

### 5.3.3 `fee_invoices` Table (Service: Fees)
```sql
CREATE TABLE fee_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    student_id UUID REFERENCES students(id),
    amount NUMERIC(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'UNPAID', -- UNPAID, PAID, OVERDUE
    generated_at TIMESTAMPTZ DEFAULT now()
);
```

## 5.4 RLS Policy Implementation
This is the security backbone.

```sql
-- 1. Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- 2. Create Policy
-- "current_user" sees rows where tenant_id matches the session variable
CREATE POLICY tenant_isolation_policy ON students
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- 3. Force RLS (Safety Net)
ALTER TABLE students FORCE ROW LEVEL SECURITY;
```

## 5.5 Migration Strategy
*   Tool: `sqlx-cli` (Rust) or `dbmate`.
*   Versioning: Timestamp-based migrations (e.g., `20241022120000_create_students.sql`).
*   Pipeline: CI/CD runs migrations on `staging` before `prod`. Plugins manage their own migrations.
