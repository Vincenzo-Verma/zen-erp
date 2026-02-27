import { Link } from 'react-router-dom';

const features = [
    {
        icon: 'ti ti-school',
        title: 'School Management',
        description: 'Manage students, staff, classes, attendance, and fees from one unified dashboard.',
    },
    {
        icon: 'ti ti-users-group',
        title: 'Multi-Tenant',
        description: 'Run multiple schools under one account. Each school gets its own isolated workspace.',
    },
    {
        icon: 'ti ti-world-www',
        title: 'Student Portal',
        description: 'Give students their own subdomain login. Parents can track progress and pay fees online.',
    },
    {
        icon: 'ti ti-plug',
        title: 'Plugin Marketplace',
        description: 'Extend your platform with plugins for billing, timetables, transport, and more.',
    },
];

export function LandingPage() {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Navbar */}
            <nav className="d-flex justify-content-between align-items-center px-4 py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                <Link to="/" className="text-decoration-none d-flex align-items-center gap-2">
                    <img src="/assets/img/logo.svg" alt="Preskool" height="36" />
                </Link>
                <div className="d-flex gap-2">
                    <Link to="/login" className="btn btn-outline-primary btn-sm">Sign In</Link>
                    <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
                </div>
            </nav>

            {/* Hero */}
            <section className="text-center py-5 px-3" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ maxWidth: 700, margin: '0 auto' }}>
                    <h1 className="fw-bold mb-3" style={{ fontSize: '2.5rem', lineHeight: 1.2 }}>
                        Modern School Management,<br />Built for Scale
                    </h1>
                    <p className="text-muted mb-4" style={{ fontSize: '1.1rem' }}>
                        A multi-tenant ERP platform for managing schools, staff, students, fees, and more.
                        Each school gets its own workspace, portal, and custom domain.
                    </p>
                    <div className="d-flex gap-3 justify-content-center">
                        <Link to="/register" className="btn btn-primary px-4 py-2">Create Free Account</Link>
                        <Link to="/login" className="btn btn-outline-secondary px-4 py-2">Sign In</Link>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-5 px-3" style={{ background: 'var(--bs-light, #f8f9fa)' }}>
                <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                    <h2 className="text-center fw-bold mb-4">Everything you need</h2>
                    <div className="row g-4">
                        {features.map((f) => (
                            <div key={f.title} className="col-md-6 col-lg-3">
                                <div className="card h-100 border-0 shadow-sm p-3">
                                    <i className={`${f.icon} mb-2`} style={{ fontSize: '2rem', color: 'var(--bs-primary, #3D5EE1)' }} />
                                    <h5 className="fw-semibold">{f.title}</h5>
                                    <p className="text-muted small mb-0">{f.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="text-center py-3 text-muted small" style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                Preskool ERP &mdash; School Management Platform
            </footer>
        </div>
    );
}
