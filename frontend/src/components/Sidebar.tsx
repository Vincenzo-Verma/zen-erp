import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useTenantStore } from '../stores/useTenantStore';
import './Sidebar.css';

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const logout = useAuthStore((s) => s.logout);
    const email = useAuthStore((s) => s.email);
    const activeTenant = useTenantStore((s) => s.activeTenant);
    const clearTenant = useTenantStore((s) => s.clearTenant);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        clearTenant();
        navigate('/login');
    };

    const handleSwitchOrg = () => {
        clearTenant();
        navigate('/tenants');
    };

    return (
        <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
            {/* Tenant Header */}
            <div className="sidebar-header">
                <div className="sidebar-tenant" onClick={handleSwitchOrg} title="Switch Organization">
                    <div className="tenant-avatar">
                        {activeTenant?.name?.charAt(0)?.toUpperCase() || 'E'}
                    </div>
                    {!collapsed && (
                        <div className="tenant-info">
                            <span className="tenant-name">{activeTenant?.name || 'SaaS ERP'}</span>
                            <span className="tenant-slug">{activeTenant?.slug || 'Select org'}</span>
                        </div>
                    )}
                </div>
                <button
                    className="sidebar-toggle"
                    onClick={() => setCollapsed(!collapsed)}
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        {collapsed ? (
                            <polyline points="9 18 15 12 9 6" />
                        ) : (
                            <polyline points="15 18 9 12 15 6" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <div className="nav-section">
                    <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <rect x="3" y="3" width="7" height="7" rx="1" />
                            <rect x="14" y="3" width="7" height="7" rx="1" />
                            <rect x="3" y="14" width="7" height="7" rx="1" />
                            <rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                        {!collapsed && <span>Dashboard</span>}
                    </NavLink>
                </div>

                <div className="nav-section">
                    {!collapsed && <span className="nav-section-title">Plugins</span>}
                    <NavLink to="/marketplace" className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                        {!collapsed && <span>Marketplace</span>}
                    </NavLink>
                    <div className="nav-item nav-disabled" title="Coming soon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                        {!collapsed && <span>School Management</span>}
                    </div>
                    <div className="nav-item nav-disabled" title="Coming soon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <path d="M20 7h-3a2 2 0 0 1-2-2V2" />
                            <path d="M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2H9z" />
                            <path d="M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8" />
                        </svg>
                        {!collapsed && <span>Inventory</span>}
                    </div>
                </div>

                <div className="nav-section">
                    {!collapsed && <span className="nav-section-title">Administration</span>}
                    <NavLink to="/users" className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        {!collapsed && <span>Users & Roles</span>}
                    </NavLink>
                    <NavLink to="/billing" className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                            <line x1="1" y1="10" x2="23" y2="10" />
                        </svg>
                        {!collapsed && <span>Billing & Wallet</span>}
                    </NavLink>
                    <NavLink to="/audit" className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                        </svg>
                        {!collapsed && <span>Audit Log</span>}
                    </NavLink>
                    <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                        {!collapsed && <span>Settings</span>}
                    </NavLink>
                </div>

                {/* Platform Admin Section */}
                <div className="nav-section">
                    {!collapsed && <span className="nav-section-title nav-section-admin">Platform Admin</span>}
                    <NavLink to="/admin" end className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        {!collapsed && <span>Admin Dashboard</span>}
                    </NavLink>
                    <NavLink to="/admin/tenants" className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        {!collapsed && <span>All Tenants</span>}
                    </NavLink>
                    <NavLink to="/admin/health" className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                        {!collapsed && <span>System Health</span>}
                    </NavLink>
                </div>
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <NavLink to="/profile" className="sidebar-user" title="My Profile">
                    <div className="user-avatar">
                        {email?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    {!collapsed && (
                        <div className="user-info">
                            <span className="user-email">{email || 'user@example.com'}</span>
                        </div>
                    )}
                </NavLink>
                <button className="sidebar-logout" onClick={handleLogout} title="Logout">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                </button>
            </div>
        </aside>
    );
}
