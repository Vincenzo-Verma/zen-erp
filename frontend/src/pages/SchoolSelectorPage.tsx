import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useTenantStore } from '../stores/useTenantStore';
import { StatCard } from '../components/StatCard';
import type { CreateTenantRequest } from '../lib/tenants';
import { CreateTenantModal } from '../components/CreateTenantModal';
import './SchoolSelectorPage.css';

export function SchoolSelectorPage() {
    const { userId, token, email, logout } = useAuthStore();
    const { tenants, isLoading, loadTenants } = useTenantStore();
    const [showCreate, setShowCreate] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (userId && token) loadTenants(userId, token);
    }, [userId, token, loadTenants]);

    const totalStudents = tenants.length * 320; // mock aggregate
    const totalStaff = tenants.length * 45;
    const totalRevenue = tenants.length * 12500;

    const enterSchool = (slug: string) => {
        localStorage.setItem('erp_school_role', 'admin');
        navigate(`/school/${slug}/portal`);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="school-selector animate-fadeIn">
            {/* Navbar */}
            <nav className="ss-navbar">
                <div className="ss-navbar-brand">
                    <img src="/assets/img/logo.svg" alt="Preskool" height="36" />
                </div>
                <div className="ss-navbar-actions">
                    <span className="ss-navbar-email">{email}</span>
                    <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
                        <i className="ti ti-logout" /> Logout
                    </button>
                </div>
            </nav>

            {/* Header */}
            <div className="ss-header">
                <div>
                    <h1 className="ss-title">My Schools</h1>
                    <p className="ss-subtitle">Welcome back, {email} — manage all your institutions from here.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowCreate(true)}>
                    + Add School
                </button>
            </div>

            {/* Cumulative Analytics */}
            {tenants.length > 0 && (
                <div className="ss-stats-row">
                    <StatCard label="Total Schools" value={tenants.length.toString()} icon="🏫" trend={{ value: '+1 this month', positive: true }} />
                    <StatCard label="Total Students" value={totalStudents.toLocaleString()} icon="🎓" trend={{ value: '+12% growth', positive: true }} />
                    <StatCard label="Total Staff" value={totalStaff.toString()} icon="👩‍🏫" trend={{ value: 'Across all schools', positive: true }} />
                    <StatCard label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon="💰" trend={{ value: '+8% this quarter', positive: true }} />
                </div>
            )}

            {/* School Grid */}
            {isLoading ? (
                <div className="ss-loading">Loading your schools...</div>
            ) : tenants.length === 0 ? (
                <div className="ss-empty glass-card">
                    <div className="ss-empty-icon">🏫</div>
                    <h2>No Schools Yet</h2>
                    <p>Create your first school to get started with the platform.</p>
                    <button className="btn-primary" onClick={() => setShowCreate(true)}>Create School</button>
                </div>
            ) : (
                <div className="ss-grid">
                    {tenants.map((school) => (
                        <div key={school.id} className="ss-card glass-card">
                            <div className="ss-card-header">
                                <div className="ss-card-icon">🏫</div>
                                <div className="ss-card-info">
                                    <h3 className="ss-card-name">{school.name}</h3>
                                    <span className="ss-card-slug">{school.slug}.saas-erp.com</span>
                                </div>
                                <span className={`ss-status-badge ${school.status === 'active' ? 'status-active' : 'status-suspended'}`}>
                                    {school.status}
                                </span>
                            </div>

                            <div className="ss-card-stats">
                                <div className="ss-mini-stat">
                                    <span className="ss-mini-value">320</span>
                                    <span className="ss-mini-label">Students</span>
                                </div>
                                <div className="ss-mini-stat">
                                    <span className="ss-mini-value">45</span>
                                    <span className="ss-mini-label">Staff</span>
                                </div>
                                <div className="ss-mini-stat">
                                    <span className="ss-mini-value">{school.plan_tier}</span>
                                    <span className="ss-mini-label">Plan</span>
                                </div>
                            </div>

                            <div className="ss-card-actions">
                                <button className="ss-enter-btn ss-enter-admin" onClick={() => enterSchool(school.slug)} style={{ width: '100%' }}>
                                    Enter Portal
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <CreateTenantModal
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
                onSubmit={async (name, slug) => {
                    if (!token || !userId) return;
                    const data: CreateTenantRequest = { name, slug, owner_user_id: userId, type: 'school' };
                    await useTenantStore.getState().createTenant(data, token);
                }}
            />
        </div>
    );
}
