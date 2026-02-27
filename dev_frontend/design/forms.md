# Forms Guideline

Form pages (like `add-student.html`) are structured extensively with grouped cards to break down long forms into logical sections.

## 1. Page Layout Structure
Wrap the form inside the standard `page-wrapper > content` structure, and usually, the entire page has one single `<form>` element wrapping all the cards.

```html
<div class="page-wrapper">
    <!-- Notice the 'content-two' class sometimes used for form pages padding adjustments -->
    <div class="content content-two">
        
        <!-- Page Header -->
        <div class="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div class="my-auto mb-2">
                <h3 class="mb-1">Add Entity</h3>
                <nav>
                    <ol class="breadcrumb mb-0">
                        <li class="breadcrumb-item"><a href="...">Dashboard</a></li>
                        <li class="breadcrumb-item"><a href="...">Entities</a></li>
                        <li class="breadcrumb-item active" aria-current="page">Add Entity</li>
                    </ol>
                </nav>
            </div>
        </div>

        <div class="row">
            <div class="col-md-12">
                <!-- Wrap everything in form -->
                <form action="...">
                    
                    <!-- Form Section 1 -->
                    <!-- Form Section 2 -->
                    <!-- Submit Actions -->

                </form>
            </div>
        </div>
    </div>
</div>
```

## 2. Form Sections (Cards)
Each section of the form is broken into a card with a `bg-light` header indicating the section.

```html
<div class="card">
    <div class="card-header bg-light">
        <!-- Section Header with Icon -->
        <div class="d-flex align-items-center">
            <span class="bg-white avatar avatar-sm me-2 text-gray-7 flex-shrink-0">
                <i class="ti ti-info-square-rounded fs-16"></i>
            </span>
            <h4 class="text-dark">Personal Information</h4>
        </div>
    </div>
    <div class="card-body pb-1">
        <!-- Form Fields Grid -->
        <div class="row row-cols-xxl-5 row-cols-md-6">
            
            <!-- Standard Input -->
            <div class="col-xxl col-xl-3 col-md-6">
                <div class="mb-3">
                    <label class="form-label">Admission Number</label>
                    <input type="text" class="form-control">
                </div>
            </div>

            <!-- Standard Select (.select invokes initialized Select2) -->
            <div class="col-xxl col-xl-3 col-md-6">
                <div class="mb-3">
                    <label class="form-label">Status</label>
                    <select class="select">
                        <option>Select</option>
                        <option>Active</option>
                        <option>Inactive</option>
                    </select>
                </div>
            </div>

            <!-- Date Picker -->
            <div class="col-xxl col-xl-3 col-md-6">
                <div class="mb-3">
                    <label class="form-label">Admission Date</label>
                    <div class="input-icon position-relative">
                        <span class="input-icon-addon">
                            <i class="ti ti-calendar"></i>
                        </span>
                        <input type="text" class="form-control datetimepicker">
                    </div>
                </div>
            </div>

            <!-- Tag Input -->
            <div class="col-xxl col-xl-3 col-md-6">
                <div class="mb-3">
                    <label class="form-label">Language Known</label>
                    <input class="input-tags form-control" type="text" data-role="tagsinput" name="Label" value="English, Spanish">
                </div>
            </div>

        </div>
    </div>
</div>
```

## 3. Upload Components
Often used for profile pictures or documents.

```html
<!-- Usually nested inside a col-md-12 above the grid -->
<div class="d-flex align-items-center flex-wrap row-gap-3 mb-3">                                                
    <div class="d-flex align-items-center justify-content-center avatar avatar-xxl border border-dashed me-2 flex-shrink-0 text-dark frames">
        <i class="ti ti-photo-plus fs-16"></i>
    </div>                                              
    <div class="profile-upload">
        <div class="profile-uploader d-flex align-items-center">
            <div class="drag-upload-btn mb-3">
                Upload
                <input type="file" class="form-control image-sign" multiple="">
            </div>
            <a href="javascript:void(0);" class="btn btn-primary mb-3">Remove</a>
        </div>
        <p class="fs-12">Upload image size 4MB, Format JPG, PNG, SVG</p>
    </div>
</div>
```

## 4. Conditional/Switch Sections
Some cards have a toggle switch in the header to conditionally enable/disable content inside.
```html
<div class="card-header bg-light d-flex align-items-center justify-content-between">
    <div class="d-flex align-items-center">
        <!-- Icon & Title -->
    </div>
    <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" role="switch">
    </div>
</div>
```

## 5. Guidelines
- Use `.form-control` for all text inputs.
- Use `.select` class to initialize Select2 styling over native select dropdowns.
- Maintain consistent bottom margins (`mb-3`) on form groups.
- Wrap groups of inputs logically in `.row` and `.col-*` structures to ensure responsiveness.
