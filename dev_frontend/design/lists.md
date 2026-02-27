# List Pages Guideline

List pages (like `students.html` or `teachers.html`) share a standard layout for presenting tabular data with advanced filtering and pagination.

## 1. Page Layout Structure
Wrap the content in the standard page architecture defined in `common_components.md`:
```html
<div class="page-wrapper">
    <div class="content">
        <!-- Page Header -->
        <div class="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div class="my-auto mb-2">
                <h3 class="page-title mb-1">Items List</h3>
                <!-- Breadcrumbs -->
            </div>
            <!-- Header Actions -->
            <div class="d-flex my-xl-auto right-content align-items-center flex-wrap">
                <!-- Refresh/Print Icons -->
                <!-- Export Dropdown -->
                <!-- Add New Button -->
                <div class="mb-2">
                    <a href="..." class="btn btn-primary d-flex align-items-center"><i class="ti ti-square-rounded-plus me-2"></i>Add Item</a>
                </div>
            </div>
        </div>
        <!-- Main List Content -->
        <div class="card">
            <!-- Filter Header -->
            <!-- Data Table -->
        </div>
    </div>
</div>
```

## 2. Main List Content (The Card)

### 2.1 The Filter Header
The header of the list card contains the title and filter/sort actions.
```html
<div class="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
    <h4 class="mb-3">Items List</h4>
    <div class="d-flex align-items-center flex-wrap">
        <!-- Date or Year Range Input -->
        <div class="input-icon-start mb-3 me-2 position-relative">
            <span class="icon-addon"><i class="ti ti-calendar"></i></span>
            <input type="text" class="form-control date-range bookingrange" placeholder="Select" value="Academic Year : 2024 / 2025">
        </div>
        <!-- Filter Dropdown -->
        <div class="dropdown mb-3 me-2">
            <a href="javascript:void(0);" class="btn btn-outline-light bg-white dropdown-toggle" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                <i class="ti ti-filter me-2"></i>Filter
            </a>
            <div class="dropdown-menu drop-width">
                <!-- Filter Form (Row > Col grid for select inputs) -->
                ...
            </div>
        </div>
        <!-- View Toggles (List vs Grid) -->
        <div class="d-flex align-items-center bg-white border rounded-2 p-1 mb-3 me-2">
            <a href="..." class="active btn btn-icon btn-sm me-1 primary-hover"><i class="ti ti-list-tree"></i></a>
            <a href="..." class="btn btn-icon btn-sm bg-light primary-hover"><i class="ti ti-grid-dots"></i></a>
        </div>
        <!-- Sort Dropdown -->
        <div class="dropdown mb-3">
            <a href="javascript:void(0);" class="btn btn-outline-light bg-white dropdown-toggle" data-bs-toggle="dropdown">
                <i class="ti ti-sort-ascending-2 me-2"></i>Sort by A-Z
            </a>
            <!-- Sort Menu Items -->
        </div>
    </div>
</div>
```

### 2.2 The Data Table
The actual table is wrapped and has specific classes to render correctly with the theme.
```html
<div class="card-body p-0 py-3">
    <!-- custom-datatable-filter wrapper is crucial for styling -->
    <div class="custom-datatable-filter table-responsive">
        <table class="table datatable">
            <thead class="thead-light">
                <tr>
                    <th class="no-sort">
                        <div class="form-check form-check-md">
                            <input class="form-check-input" type="checkbox" id="select-all">
                        </div>
                    </th>
                    <th>ID / No</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                <!-- Row Items -->
                <tr>
                    <td>
                        <div class="form-check form-check-md">
                            <input class="form-check-input" type="checkbox">
                        </div>
                    </td>
                    <td><a href="..." class="link-primary">ID12345</a></td>
                    <td>
                        <!-- Commonly used for entities with avatars -->
                        <div class="d-flex align-items-center">
                            <a href="..." class="avatar avatar-md"><img src="..." class="img-fluid rounded-circle" alt="img"></a>
                            <div class="ms-2">
                                <p class="text-dark mb-0"><a href="...">Name Here</a></p>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="badge badge-soft-success d-inline-flex align-items-center">
                            <i class="ti ti-circle-filled fs-5 me-1"></i>Active
                        </span>
                    </td>
                    <td>
                        <!-- Action Icons & Dropdown -->
                        <div class="d-flex align-items-center">
                            <a href="#" class="btn btn-outline-light bg-white btn-icon d-flex align-items-center justify-content-center rounded-circle p-0 me-2"><i class="ti ti-brand-hipchat"></i></a>
                            <!-- Action Dropdown for Edit/Delete -->
                            <div class="dropdown">
                                <a href="#" class="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i class="ti ti-dots-vertical fs-14"></i>
                                </a>
                                <ul class="dropdown-menu dropdown-menu-right p-3">
                                    <li><a class="dropdown-item rounded-1" href="..."><i class="ti ti-edit-circle me-2"></i>Edit</a></li>
                                    <li><a class="dropdown-item rounded-1" href="..." data-bs-toggle="modal" data-bs-target="#delete-modal"><i class="ti ti-trash-x me-2"></i>Delete</a></li>
                                </ul>
                            </div>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</div>
```

## 3. Notable Interactions
- Modals for actions like deleting must be placed at the end of the body or inside the main wrapper to avoid z-index conflicts.
- Tooltips and popovers should be initialized manually if rendered via JS framework.
