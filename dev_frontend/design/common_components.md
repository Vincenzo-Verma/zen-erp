# Common Components & Layout Guidelines

This document outlines the shared layout structure, CSS classes, and reusable components found across the Preskool Admin Template. When generating pages, use these exact patterns to maintain visual consistency.

## 1. Global Setup
Every authenticated page must include the following global wrappers:

```html
<div id="global-loader">
    <div class="page-loader"></div>
</div>

<!-- Main Wrapper -->
<div class="main-wrapper">
    <!-- 1. Header component here -->
    <!-- 2. Sidebar component here -->
    
    <!-- 3. Page Wrapper -->
    <div class="page-wrapper">
        <div class="content">
            <!-- Page Specific Content Here -->
        </div>
    </div>
</div>
```

## 2. Reusable Components

### 2.1 Topbar Header (`.header`)
This component is common and can be imported across all authenticated pages.
**Structure:**
```html
<div class="header">
    <div class="header-left active">
        <!-- Logos and toggle button -->
    </div>
    <!-- Mobile Menu Toggle -->
    <a id="mobile_btn" class="mobile_btn" href="#sidebar">...</a>
    
    <!-- Navigation Items -->
    <div class="header-user">
        <div class="nav user-menu">
            <!-- Search -->
            <!-- Language Dropdown -->
            <!-- Quick Add Dropdown (ti ti-square-rounded-plus) -->
            <!-- Theme Toggle (Dark/Light mode) -->
            <!-- Notifications (ti ti-bell) -->
            <!-- Profile Dropdown -->
        </div>
    </div>
</div>
```

### 2.2 Sidebar (`.sidebar#sidebar`)
This component provides the main navigation.
**Structure:**
```html
<div class="sidebar" id="sidebar">
    <div class="sidebar-inner slimscroll">
        <div id="sidebar-menu" class="sidebar-menu">
            <ul>
                <!-- Organization Profile/Dropdown -->
                <li>
                    <a href="..." class="..."><img ...><span>Global International</span></a>
                </li>
            </ul>
            <ul>
                <!-- Main Menu Groups -->
                <li>
                    <h6 class="submenu-hdr"><span>Main Group Name</span></h6>
                    <ul>
                        <li class="submenu">
                            <a href="...">
                                <i class="ti ti-layout-dashboard"></i>
                                <span>Menu Item</span>
                                <span class="menu-arrow"></span>
                            </a>
                            <ul>
                                <li><a href="...">Sub Menu</a></li>
                            </ul>
                        </li>
                        <!-- Standard Item -->
                        <li><a href="..."><i class="ti ti-[icon]"></i><span>Item Name</span></a></li>
                    </ul>
                </li>
            </ul>
        </div>
    </div>
</div>
```

### 2.3 Page Header (Breadcrumbs & Actions)
Located just inside `.page-wrapper > .content`, before the main body.
**Structure:**
```html
<!-- Page Header -->
<div class="d-md-flex d-block align-items-center justify-content-between mb-3">
    <!-- Title & Breadcrumb -->
    <div class="my-auto mb-2">
        <h3 class="page-title mb-1">Page Title</h3>
        <nav>
            <ol class="breadcrumb mb-0">
                <li class="breadcrumb-item"><a href="...">Parent</a></li>
                <li class="breadcrumb-item active" aria-current="page">Current Page</li>
            </ol>
        </nav>
    </div>
    <!-- Actions (e.g., Add New, Filters) -->
    <div class="d-flex my-xl-auto right-content align-items-center flex-wrap">
        <div class="mb-2">
            <a href="..." class="btn btn-primary d-flex align-items-center me-3">
                <i class="ti ti-square-rounded-plus me-2"></i>Action Button
            </a>
        </div>
    </div>
</div>
<!-- /Page Header -->
```

## 3. Important Design Tokens & Scripts
- **Icons**: The template heavily relies on **Tabler Icons** (`<i class="ti ti-[icon]"></i>`), **FontAwesome** (`<i class="fa fa-[icon]"></i>`), and **Feather Icons**. Always use `ti ti/fs-[size]` for UI elements.
- **Avatars**: Use `.avatar.avatar-[sm|md|lg|xl]` for profile pictures.
- **Badges**: Use `.badge.bg-[primary|success|danger|warning|info]` and `.badge-soft-[color]`.
- **Scripts needed globally**: `jquery`, `bootstrap`, `feather`, `slimscroll`, `select2`, `theme-script.js`.
