# 13. Plugin Requirements: School ERP

## 1. Overview
This document outlines the requirements for the core suite of plugins required to run a full-fledged School ERP. These plugins operate within the Microkernel architecture.

## 2. Core School Plugin (`service-school`)
**Responsibility**: The central registry for school-specific entities.
*   **Entities**:
    *   `Students`: Profile, Admission No, Class/Section linkage.
    *   `Staff`: Profile, Designation, Department.
    *   `Classes/Sections`: Grade levels (1-12) and divisions (A, B, C).
    *   `Academic Years`: Defining start/end dates for sessions.
*   **Key API Endpoints**:
    *   `POST /students/admit`: Admit a new student.
    *   `POST /staff/onboard`: Add new staff member.
    *   `GET /classes`: List all classes.

## 3. Attendance Plugin (`service-attendance`)
**Responsibility**: Tracking daily attendance for students and staff.
*   **Features**:
    *   **Student Attendance**: Marked by Class Teacher (Present/Absent/Late).
    *   **Staff Attendance**: Biometric integration or manual marking.
    *   **Leave Management**: Application and approval workflow.
*   **Data Model**:
    *   `attendance_log`: `(student_id, date, status, remarks)`.
*   **Analytics**:
    *   Absenteeism trends.
    *   Low attendance alerts (e.g., < 75%).

## 4. Timetable Plugin (`service-timetable`)
**Responsibility**: Scheduling classes and resource allocation.
*   **Features**:
    *   **Auto-Generation**: Constraint-based algorithm (Teacher availability, Room capacity).
    *   **Conflict Detection**: Prevent double-booking of teachers/rooms.
    *   **Views**: Class view, Teacher view, Room view.
*   **Entities**:
    *   `periods`: Time slots definition.
    *   `schedule`: `(class_id, period_id, subject_id, teacher_id)`.

## 5. Fee Management Plugin (`service-fees`)
**Responsibility**: Financial operations, invoicing, and payments.
*   **Features**:
    *   **Fee Structure**: Define heads (Tuition, Transport, Library).
    *   **Invoicing**: Auto-generate monthly/quarterly invoices.
    *   **Online Payment**: Gateway integration (Stripe/Razorpay).
    *   **Receipts**: Auto-generation of PDF receipts.
*   **Integration**: Syncs with Core Billing Engine for platform commission (if applicable).

## 6. Gradebook / Examination Plugin (`service-gradebook`)
**Responsibility**: Assessments and Report Cards.
*   **Features**:
    *   **Exam Configuration**: Define exam types (Unit Test, Mid-Term, Final).
    *   **Grade Entry**: Subject teachers enter marks.
    *   **Report Card Generation**: Template-based PDF generation.
    *   **GPA Calculation**: Auto-calculation based on defined logic.

## 7. Transport Plugin (Future)
**Responsibility**: Fleet management and bus routes.
*   **Features**:
    *   Route definition and stops.
    *   Vehicle maintenance logs.
    *   Parent tracking app (GPS integration).
