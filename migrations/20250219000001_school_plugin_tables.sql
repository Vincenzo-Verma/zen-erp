-- =============================================================
-- Migration: School Plugin Tables
-- =============================================================

-- Staff — extends users with school-specific fields
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_number TEXT NOT NULL,
    designation TEXT NOT NULL DEFAULT 'teacher',  -- teacher, clerk, principal, driver
    department TEXT,
    date_of_joining DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, employee_number),
    UNIQUE (tenant_id, user_id)
);

-- Students — extends users with school-specific fields
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- nullable: young students may not have login
    admission_number TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    class_grade INT NOT NULL,
    section CHAR(1) NOT NULL DEFAULT 'A',
    class_teacher_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    parent_email TEXT,
    date_of_birth DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, admission_number)
);

-- Staff ↔ Class assignments (which teacher teaches which class/section)
CREATE TABLE IF NOT EXISTS staff_class_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    class_grade INT NOT NULL,
    section CHAR(1) NOT NULL,
    subject TEXT,
    academic_year TEXT NOT NULL DEFAULT '2025-26',
    UNIQUE (tenant_id, staff_id, class_grade, section, subject)
);

-- Attendance log
CREATE TABLE IF NOT EXISTS attendance_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'LEAVE')),
    marked_by UUID REFERENCES staff(id),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, student_id, date)
);

-- Fee invoices
CREATE TABLE IF NOT EXISTS fee_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    fee_head TEXT NOT NULL DEFAULT 'tuition',  -- tuition, transport, library
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'UNPAID'
        CHECK (status IN ('UNPAID', 'PAID', 'OVERDUE', 'CANCELLED')),
    paid_at TIMESTAMPTZ,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS idx_staff_tenant ON staff(tenant_id);
CREATE INDEX IF NOT EXISTS idx_students_tenant ON students(tenant_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(tenant_id, class_grade, section);
CREATE INDEX IF NOT EXISTS idx_attendance_composite ON attendance_log(tenant_id, date, student_id);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_student ON fee_invoices(tenant_id, student_id);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_status ON fee_invoices(tenant_id, status);
