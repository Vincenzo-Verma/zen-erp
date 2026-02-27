# Dashboards Guideline

Dashboards in the Preskool template serve as the primary landing pages for different user roles (Admin, Teacher, Student, Parent). They are data-heavy and utilize metric cards, charts, and timeline feeds.

## 1. Page Layout Structure
All dashboards are wrapped inside the standard layout detailed in `common_components.md`:
```html
<div class="page-wrapper">
    <div class="content">
        <!-- Page Header (See common_components.md) -->
        <!-- Dashboard Content Grid -->
    </div>
</div>
```

## 2. Key Dashboard Elements

### 2.1 Welcome Banner
Usually placed at the top of the dashboard to greet the user. It spans full width and uses a dark background with overlay shapes.
```html
<div class="card bg-dark">
    <div class="overlay-img">
        <!-- Background shapes -->
        <img src="assets/img/bg/shape-04.png" alt="img" class="img-fluid shape-01">
    </div>
    <div class="card-body">
        <div class="d-flex align-items-xl-center justify-content-xl-between flex-xl-row flex-column">
            <!-- Greeting -->
            <div class="mb-3 mb-xl-0">
                <div class="d-flex align-items-center flex-wrap mb-2">
                    <h1 class="text-white me-2">Welcome Back, Name</h1>
                </div>
                <p class="text-white">Subtext message</p>
            </div>
            <!-- Dynamic Info -->
            <p class="text-white"><i class="ti ti-refresh me-1"></i>Updated Recently...</p>
        </div>
    </div>
</div>
```

### 2.2 Metric/Stats Cards
Used to display high-level numbers (e.g., Total Students, Total Teachers). They are typically grouped in a row.
**Structure for 4 cards in a row (`col-xxl-3 col-sm-6`)**:
```html
<div class="row">
    <!-- Stat Card -->
    <div class="col-xxl-3 col-sm-6 d-flex">
        <div class="card flex-fill animate-card border-0">
            <div class="card-body">
                <div class="d-flex align-items-center">
                    <!-- Icon container (color variants: bg-[danger|secondary|warning|success]-transparent) -->
                    <div class="avatar avatar-xl bg-danger-transparent me-2 p-1">
                        <img src="assets/img/icons/icon.svg" alt="img">
                    </div>
                    <!-- Data -->
                    <div class="overflow-hidden flex-fill">
                        <div class="d-flex align-items-center justify-content-between">
                            <h2 class="counter">3654</h2>
                            <span class="badge bg-danger">1.2%</span>
                        </div>
                        <p>Total Students</p>
                    </div>
                </div>
                <!-- Sub-stats (Active/Inactive) -->
                <div class="d-flex align-items-center justify-content-between border-top mt-3 pt-3">
                    <p class="mb-0">Active : <span class="text-dark fw-semibold">3643</span></p>
                    <span class="text-light">|</span>
                    <p>Inactive : <span class="text-dark fw-semibold">11</span></p>
                </div>
            </div>
        </div>
    </div>
</div>
```

### 2.3 Schedule / Timeline Component
Used to show upcoming events or classes. Usually placed in a `col-xxl-4 col-xl-6` grid.
```html
<div class="card flex-fill">
    <div class="card-header d-flex align-items-center justify-content-between">
        <h4 class="card-title">Schedules</h4>
        <a href="#" class="link-primary fw-medium me-2"><i class="ti ti-square-plus me-1"></i>Add New</a>
    </div>
    <div class="card-body">
        <div class="event-wrapper event-scroll">
            <!-- Event Item (Border color variants: border-[skyblue|info|danger|success]) -->
            <div class="border-start border-skyblue border-3 shadow-sm p-3 mb-3">
                <div class="d-flex align-items-center mb-3 pb-3 border-bottom">
                    <span class="avatar p-1 me-2 bg-teal-transparent flex-shrink-0">
                        <i class="ti ti-user-edit text-info fs-20"></i>
                    </span>
                    <div class="flex-fill">
                        <h6 class="mb-1">Event Title</h6>
                        <p class="d-flex align-items-center"><i class="ti ti-calendar me-1"></i>Date</p>
                    </div>
                </div>
                <div class="d-flex align-items-center justify-content-between">
                    <p class="mb-0"><i class="ti ti-clock me-1"></i>Time</p>
                    <!-- Avatar Stack for Participants -->
                    <div class="avatar-list-stacked avatar-group-sm">
                        <span class="avatar border-0"><img src="..." class="rounded-circle"></span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
```

### 2.4 Quick Links Carousel
Used for quick navigation to frequent actions.
```html
<div class="card flex-fill">
    <div class="card-header"><h4 class="card-title">Quick Links</h4></div>
    <div class="card-body pb-1">
        <!-- Typically wrapped in an owl-carousel, but structure for a single link item is: -->
        <a href="..." class="d-block bg-success-transparent ronded p-2 text-center mb-3 class-hover">
            <div class="avatar avatar-lg border p-1 border-success rounded-circle mb-2">
                <span class="d-inline-flex align-items-center justify-content-center w-100 h-100 bg-success rounded-circle">
                    <i class="ti ti-calendar"></i>
                </span>
            </div>
            <p class="text-dark">Calendar</p>
        </a>
    </div>
</div>
```

## CSS Utilities Used Extensively
- Flexible utilities (`d-flex`, `align-items-center`, `justify-content-between`, `flex-fill`, `flex-column`)
- Spacing (`mb-3`, `pb-1`, `mt-4`, `p-3`, `me-2`)
- Border behaviors (`border-0`, `border-bottom`, `border-start border-3`)
- Colors (`bg-[color]-transparent`, `text-[color]`, `link-[color]`)
