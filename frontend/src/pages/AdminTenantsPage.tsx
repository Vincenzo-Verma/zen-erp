import { useState } from 'react';
import './AdminTenantsPage.css';

type TenantStatus = 'active' | 'grace_period' | 'suspended' | 'archived';

interface PlatformTenant {
    id: string;
    name: string;
    slug: string;
    status: TenantStatus;
    plan_tier: string;
    users: number;
    balance: number;
    created: string;
}

const mockTenants: PlatformTenant[] = [
    { id: '1', name: 'Acme Corp', slug: 'acme', status: 'active', plan_tier: 'pro', users: 12, balance: 240.50, created: '2026-01-15' },
    { id: '2', name: 'CloudBase', slug: 'cloudbase', status: 'active', plan_tier: 'free', users: 8, balance: 120.00, created: '2026-01-20' },
    { id: '3', name: 'DevStudio', slug: 'devstudio', status: 'grace_period', plan_tier: 'free', users: 5, balance: 2.30, created: '2026-01-22' },
    { id: '4', name: 'EduPortal', slug: 'eduportal', status: 'active', plan_tier: 'enterprise', users: 22, balance: 580.00, created: '2026-01-28' },
    { id: '5', name: 'MediCare', slug: 'medicare', status: 'suspended', plan_tier: 'free', users: 3, balance: 0.00, created: '2026-02-01' },
    { id: '6', name: 'RetailHub', slug: 'retailhub', status: 'active', plan_tier: 'pro', users: 15, balance: 340.00, created: '2026-02-05' },
    { id: '7', name: 'LogiTrack', slug: 'logitrack', status: 'active', plan_tier: 'free', users: 6, balance: 45.00, created: '2026-02-18' },
    { id: '8', name: 'FinEdge', slug: 'finedge', status: 'grace_period', plan_tier: 'free', users: 4, balance: 0.80, created: '2026-02-19' },
];

const tabFilters: { label: string; value: TenantStatus | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Grace Period', value: 'grace_period' },
    { label: 'Suspended', value: 'suspended' },
];

const statusColors: Record<TenantStatus, string> = {
    active: 'var(--accent-success)',
    grace_period: 'var(--accent-warning)',
    suspended: 'var(--accent-danger)',
    archived: 'var(--text-muted)',
};

export function AdminTenantsPage() {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<TenantStatus | 'all'>('all');

    const filtered = mockTenants.filter((t) => {
        if (filter !== 'all' && t.status !== filter) return false;
        if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.slug.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="admin-tenants animate-fadeIn">
            <div className="page-header-row">
                <div>
                    <h1 className="page-title">Tenant Management</h1>
                    <p className="page-subtitle">View and manage all organizations on the platform</p>
                </div>
                <span className="admin-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    {mockTenants.length} Tenants
                </span>
            </div>

            {/* Search & Filter */}
            <div className="tenants-toolbar glass-card">
                <div className="tenants-search">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" className="search-icon">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        className="search-input"
                        type="text"
                        placeholder="Search tenants..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="filter-tabs">
                    {tabFilters.map((tab) => (
                        <button
                            key={tab.value}
                            className={`filter-tab ${filter === tab.value ? 'filter-tab-active' : ''}`}
                            onClick={() => setFilter(tab.value)}
                        >
                            {tab.label}
                            {tab.value !== 'all' && (
                                <span className="filter-count">
                                    {mockTenants.filter((t) => t.status === tab.value).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="tenants-table-card glass-card">
                <table className="tenants-table">
                    <thead>
                        <tr>
                            <th>Organization</th>
                            <th>Status</th>
                            <th>Plan</th>
                            <th>Users</th>
                            <th>Balance</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7}>
                                    <div className="tenants-empty">
                                        <span>No tenants match your filters</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map((t) => (
                                <tr key={t.id}>
                                    <td>
                                        <div className="tenant-cell">
                                            <div className="tenant-cell-avatar">
                                                {t.name.charAt(0)}
                                            </div>
                                            <div className="tenant-cell-info">
                                                <span className="tenant-cell-name">{t.name}</span>
                                                <span className="tenant-cell-slug">/{t.slug}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="status-pill" style={{ background: statusColors[t.status] + '22', color: statusColors[t.status] }}>
                                            {t.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td><span className="plan-label">{t.plan_tier}</span></td>
                                    <td>{t.users}</td>
                                    <td className={t.balance <= 0 ? 'balance-zero' : ''}>${t.balance.toFixed(2)}</td>
                                    <td className="date-cell">{t.created}</td>
                                    <td>
                                        <div className="row-actions">
                                            <button className="btn btn-ghost btn-sm" title="View">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                                </svg>
                                            </button>
                                            {t.status === 'active' ? (
                                                <button className="btn btn-ghost btn-sm btn-danger-text" title="Suspend">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                                        <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                                    </svg>
                                                </button>
                                            ) : (
                                                <button className="btn btn-ghost btn-sm btn-success-text" title="Activate">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
