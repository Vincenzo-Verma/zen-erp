# 3. Information Architecture

## 3.1 high-Level Sitemap

*   **Public Site**
    *   Home / Landing Page
    *   Pricing
    *   Marketplace (Plugin Catalog)
    *   Login / Register
    *   Docs / Help

*   **App (Authenticated)**
    *   **Global Context (User Level)**
        *   User Profile & Settings
        *   **Tenant Switcher** (Central Navigation Element)
        *   Create New Organization
        *   Billing & Wallet (Global or Per-Tenant)

    *   **Tenant Context (Organization Level)**
        *   **Dashboard** (Widgetized, Plugin-driven)
        *   **Core Modules**
            *   User Management (Staff, Users)
            *   Role Assignments
            *   Settings / Configuration
        *   **Installed Plugins (Dynamic Menu)**
            *   *School Management* -> [Students, Classes, Attendance]
            *   *Inventory* -> [Items, Stock, suppliers]
            *   *Hospital OPD* -> [Patients, Appointments, Prescriptions]

## 3.2 Navigation Structure

### 3.2.1 Sidebar (Collapsible)
*   **Top**: Organization Logo & Name (Context Indicator).
*   **Middle**:
    *   Dashboard
    *   *--- Plugin Section ---* (Dynamically rendered based on installed plugins)
    *   App 1
    *   App 2
    *   *--- Administration ---*
    *   Users & Roles
    *   Settings
*   **Bottom**: User Profile, Logout.

### 3.2.2 Top Bar
*   **Left**: Breadcrumbs.
*   **Right**:
    *   **Wallet Balance** (Critical Visibility).
    *   Notifications Bell.
    *   Help / Support.

## 3.3 Dashboard Layout
The dashboard is a container for **Widgets** exposed by plugins.
*   **Default State**: System status, Wallet balance, Recent activity.
*   **Plugin Widgets**:
    *   *School Plugin* adds "Today's Attendance Summary".
    *   *Billing Core* adds "Projected Daily Cost".
*   **Layout**: Grid-based, responsive.

## 3.4 User Interface Patterns
*   **Tenant Context Header**: Visual cue (color border or badge) to remind user which organization they are managing.
*   **Suspended State**: If account is suspended/unpaid, a non-dismissible global banner overrides the UI, disabling interactions except "Make Payment".
