# Authentication Pages Guideline

Authentication pages (`login.html`, `register.html`, `forgot-password.html`) use a completely different layout compared to standard dashboard and management pages.

## 1. Page Layout Structure
The primary difference is that these pages do **not** use the `.header`, `.sidebar`, or `.page-wrapper`. They attach the class `.account-page` to the `body` element.

```html
<body class="account-page">
    <!-- Main Wrapper -->
    <div class="main-wrapper">
        <div class="container-fuild">
            <!-- vh-100 ensures full viewport height -->
            <div class="w-100 overflow-hidden position-relative flex-wrap d-block vh-100">
                <div class="row">
                    <!-- Split layout: Image/Banner on left, Form on right -->
                    
                    <!-- Left Column (Hidden on mobile) -->
                    <div class="col-lg-6">
                        <div class="login-background position-relative d-lg-flex align-items-center justify-content-center d-lg-block d-none flex-wrap vh-100 overflowy-auto">
                            <!-- Background Image -->
                            <div>
                                <img src="assets/img/authentication/authentication-02.jpg" alt="Img">
                            </div>
                            <!-- Overlay Content Container -->
                            <div class="authen-overlay-item w-100 p-4">
                                <h4 class="text-white mb-3">Banner Title Here</h4>
                                <!-- Highlight Cards -->
                                <div class="d-flex align-items-center flex-row mb-3 justify-content-between p-3 br-5 gap-3 card">
                                    <div>
                                        <h6>Information Title</h6>
                                        <p class="mb-0 text-truncate">Brief description text...</p>
                                    </div>
                                    <a href="javascript:void(0);"><i class="ti ti-chevrons-right"></i></a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column (Form Area) -->
                    <div class="col-lg-6 col-md-12 col-sm-12">
                        <div class="row justify-content-center align-items-center vh-100 overflow-auto flex-wrap ">
                            <div class="col-md-8 mx-auto p-4">
                                <form action="...">
                                    <!-- Logo Center -->
                                    <div class="mx-auto mb-5 text-center">
                                        <img src="assets/img/authentication/authentication-logo.svg" class="img-fluid" alt="Logo">
                                    </div>
                                    
                                    <!-- Auth Card -->
                                    <div class="card">
                                        <div class="card-body p-4">
                                            <!-- Form Headers -->
                                            <div class="mb-4">
                                                <h2 class="mb-2">Welcome</h2>
                                                <p class="mb-0">Please enter your details to sign in</p>
                                            </div>

                                            <!-- Social Auth Buttons -->
                                            <div class="mt-4">
                                                <div class="d-flex align-items-center justify-content-center flex-wrap">
                                                    <!-- Buttons (bg-primary, btn-outline-light, bg-dark) -->
                                                </div>
                                            </div>

                                            <!-- Separator -->
                                            <div class="login-or">
                                                <span class="span-or">Or</span>
                                            </div>

                                            <!-- Form Inputs -->
                                            <div class="mb-3 ">
                                                <label class="form-label">Email Address</label>
                                                <div class="input-icon mb-3 position-relative">
                                                    <span class="input-icon-addon"><i class="ti ti-mail"></i></span>
                                                    <input type="text" value="" class="form-control">
                                                </div>
                                                
                                                <label class="form-label">Password</label>
                                                <div class="pass-group">
                                                    <input type="password" class="pass-input form-control">
                                                    <!-- Password Toggle Icon -->
                                                    <span class="ti toggle-password ti-eye-off"></span>
                                                </div>
                                            </div>

                                            <!-- Remember Me & Forgot Password -->
                                            <div class="form-wrap form-wrap-checkbox mb-3">
                                                <div class="d-flex align-items-center">
                                                    <div class="form-check form-check-md mb-0">
                                                        <input class="form-check-input mt-0" type="checkbox">
                                                    </div>
                                                    <p class="ms-1 mb-0 ">Remember Me</p>
                                                </div>
                                                <div class="text-end ">
                                                    <a href="forgot-password.html" class="link-danger">Forgot Password?</a>
                                                </div>
                                            </div>

                                            <!-- Submit -->
                                            <div class="mb-3">
                                                <button type="submit" class="btn btn-primary w-100">Sign In</button>
                                            </div>
                                            
                                            <!-- Redirect Link -->
                                            <div class="text-center">
                                                <h6 class="fw-normal text-dark mb-0">Don’t have an account? <a href="register.html" class="hover-a "> Create Account</a></h6>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Copyright -->
                                    <div class="mt-5 text-center">
                                        <p class="mb-0 ">Copyright &copy; 2024 - Preskool</p>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
```

## 2. Shared Assets
- For all auth pages, the container structure `div.container-fuild > div.w-100.vh-100 > div.row` is vital to establish the split-page design on desktop screens, falling back to a centered form on mobile.
- Make sure to use `.input-icon` wrappers with absolute-positioned `.input-icon-addon` items to embed icons cleanly within the input fields (e.g., Mail icon for Email input).
- Use `pass-group` div around password inputs alongside `<span class="ti toggle-password ti-eye-off"></span>` to allow the show/hide password script to hook into the UI.
