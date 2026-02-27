# School Portals UI Design

This document outlines the frontend structure for the three distinct portals required for the School ERP.

## 1. Super Admin Dashboard (Global View)
**User**: Multi-School Owner
**URL**: `app.saas-erp.com`

### Features
*   **School Switcher**: Dropdown to jump into any school's context.
*   **Cumulative Analytics Card**:
    *   Total Revenue (Across all schools).
    *   Total Students Enrolled.
    *   Total Staff Count.
*   **School List**: Grid view of all owned schools with status (Active/Suspended) and quick links to their settings.
*   **Global Billing**: Wallet balance and subscription tier management for the entire account.

## 2. School Admin Portal
**User**: Principal / School Administrator
**URL**: `[school-slug].saas-erp.com/admin`

### Modules
*   **Dashboard**: Daily attendance summary, upcoming events, fee collection stats.
*   **Student Info System (SIS)**: Admission forms, student directory, promotion logic.
*   **HR & Payroll**: Staff directory, leave approval, payroll generation.
*   **Academics**: Class/Section management, Subject allocation.
*   **Plugin Store**: Activate/Deactivate plugins (Results, Transport, etc.).

## 3. Staff Portal
**User**: Teachers, Clerks, Drivers
**URL**: `[school-slug].saas-erp.com/staff`

### Features
*   **Start Page**: Today's timetable, pending tasks (leave requests, grading).
*   **Attendance Marking**: Interactive grid to mark student attendance.
*   **Gradebook**: Spreadsheet-like interface for entering marks.
*   **My Leaves**: Apply for leave, view leave balance.

## 4. Student/Parent Portal
**User**: Students, Guardians
**URL**: `[school-slug].saas-erp.com/student`

### Features
*   **Timeline**: Homework, circulars, and event notifications.
*   **Report Cards**: Downloadable PDF reports.
*   **Fee Payment**: View dues and pay online via gateway.
*   **Profile**: View/Edit basic details (address, contact).

## 5. Shared UI Components
*   **Theme Engine**: Allow Admins to pick primary colors/logos to brand their portals.
*   **Role-Based Sidebar**: Dynamic sidebar items based on the active portal and user permissions.
