# School Specific Tenant Routes

## Overview
In the School ERP architecture, tenants are individual **Schools**. A single user (Super Admin) can own multiple Schools.

## 1. Create School (Tenant)
Creates a new School instance.

- **Endpoint**: `POST /api/v1/tenants`
- **Body**:
  ```json
  {
    "name": "Springfield High",
    "slug": "springfield",  // Will map to springfield.saas-erp.com
    "type": "school",       // Metadata for plugin activation
    "domain": "springfieldhigh.com" // Custom domain (optional upgrade)
  }
  ```

## 2. Domain & Portal Mapping
The system maps incoming requests to a specific portal type based on the path.

| URL Pattern | Portal Type | Audience | Auth Scope |
|---|---|---|---|
| `springfield.saas-erp.com/admin` | **Admin Portal** | Principal/Owner | `role:admin` |
| `springfield.saas-erp.com/staff` | **Staff Portal** | Teachers/Clerks | `role:staff` |
| `springfield.saas-erp.com/student` | **Student Portal** | Students/Parents | `role:student` |

## 3. Frontend Implementation Guidelines
The frontend should detect the `slug` from the subdomain (or path) and switch contexts automatically.

### Portal Context
*   **Global Context (`saas-erp.com`)**:
    *   Login/Signup for Super Admins.
    *   Dashboard showing list of all schools.
    *   Billing/Subscription management.

*   **School Context (`school-slug.saas-erp.com`)**:
    *   Login pages branded with School Logo.
    *   Dashboard specific to that school's data.

## 4. User Invitation flow
Admins invite users to specific portals:
*   **Invite Staff**: Generates link to `/staff/login`.
*   **Invite Student**: Generates link to `/student/login`.
