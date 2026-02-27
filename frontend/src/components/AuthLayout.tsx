import { useEffect, type ReactNode } from 'react';

interface AuthLayoutProps {
    title: string;
    subtitle: string;
    children: ReactNode;
    overlayTitle?: string;
    overlaySubtitle?: string;
    footer?: ReactNode;
}

export function AuthLayout({
    title,
    subtitle,
    children,
    overlayTitle = 'Welcome to Preskool',
    overlaySubtitle = 'Manage your school operations efficiently with our comprehensive ERP solution.',
    footer,
}: AuthLayoutProps) {
    useEffect(() => {
        document.body.classList.add('account-page');
        return () => {
            document.body.classList.remove('account-page');
        };
    }, []);

    return (
        <div className="main-wrapper">
            <div className="container-fluid">
                <div className="w-100 overflow-hidden position-relative flex-wrap d-block vh-100">
                    <div className="row">
                        {/* Left column - background image with overlay */}
                        <div className="col-lg-6">
                            <div className="login-background position-relative d-lg-flex d-lg-block d-none">
                                <img
                                    src="/assets/img/authentication/authentication-02.jpg"
                                    alt="Login Background"
                                    className="w-100 h-100 object-fit-cover"
                                />
                                <div className="bg-overlay">
                                    <div className="overlay-content d-flex flex-column justify-content-center align-items-center h-100 text-white p-4">
                                        <div className="card bg-transparent border-0 text-center mb-4">
                                            <h3 className="text-white mb-3">{overlayTitle}</h3>
                                            <p className="text-white opacity-75">{overlaySubtitle}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right column - form */}
                        <div className="col-lg-6 col-md-12 col-sm-12">
                            <div className="d-flex justify-content-center align-items-center vh-100">
                                <div className="row justify-content-center w-100">
                                    <div className="col-md-8 mx-auto">
                                        <div className="text-center mb-4">
                                            <img
                                                src="/assets/img/authentication/authentication-logo.svg"
                                                alt="Logo"
                                                className="img-fluid"
                                            />
                                        </div>

                                        <div className="card">
                                            <div className="card-body p-4">
                                                <h2 className="mb-2">{title}</h2>
                                                <p className="mb-4 text-muted">{subtitle}</p>

                                                {children}

                                                {footer && (
                                                    <div className="text-center mt-4">
                                                        {footer}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-center mt-3">
                                            <p className="text-muted mb-0">
                                                &copy; {new Date().getFullYear()} Preskool. All rights reserved.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
