# 1. Product Requirements Document (PRD)

## 1.1 Product Vision
To build a **unified, high-performance School ERP platform** that democratizes enterprise-grade tools for educational institutions. By utilizing a **Microkernel "Core + Plugins" architecture**, the platform adapts to schools of all sizes. The business model is **"Pay-As-You-Go"**, eliminating high upfront costs.

## 1.2 Target Audience
*   **Multi-School Admins (Super Admins)**: Owners managing a chain of schools. They need a centralized view of all their institutions with cumulative analytics.
*   **School Admins**: Principals or administrators managing a single school branch.
*   **Staff (Teachers/Clerks)**: Daily users for attendance, grading, and operations.
*   **Students/Parents**: End-users accessing portals for progress reports and fees.

## 1.3 Key Features
### 1.3.1 Hierarchical Multi-Tenancy
*   **Multi-School Management**: A single Admin account can create and manage multiple "School" tenants.
*   **Cumulative Analytics**: The Admin Dashboard aggregates data (Revenue, Student Count, Staff Performance) across all owned schools.

### 1.3.2 Unique School Endpoints & Portals
*   **Dedicated Access**: Each school gets a unique URL (e.g., `st-marys.saas-erp.com` or `saas-erp.com/school/st-marys`).
*   **Branded Portals**:
    *   **Admin Portal**: For owners/principals to manage the school.
    *   **Staff Portal**: For teachers to mark attendance and grades.
    *   **Student/Parent Portal**: For viewing reports and paying fees.

### 1.3.3 Role-Based Access Control (RBAC)
*   **Global Roles**: Super Admin (Owner of multiple schools).
*   **Tenant Roles**: Admin, Teacher, Student, Parent, Accountant.
*   **Strict Isolation**: A teacher in School A has no access to School B.

### 1.3.4 Core Functionality
*   **Universal Tenancy**: Single login for Admins to switch between schools.
*   **Pay-As-You-Go Billing**: Centralized wallet for the Super Admin covering all schools.
*   **Strict Data Isolation**: RLS ensures absolute data separation between schools.

### 1.3.5 Extensible Plugin System
*   **Core Plugins**: Attendance, Timetable, Fee Management, Gradebook.
*   **Future Ready**: Marketplace for third-party plugins (Transport, Library, Hostel).

## 1.4 Success Metrics
*   **Performance**: API latency < **50ms**.
*   **Scalability**: Support **100+ schools** under a single Super Admin.
*   **Reliability**: **99.9% Uptime** during school hours.
