import { StatCard } from '../components/StatCard';
import { BarChart, Sparkline, Gauge } from '../components/MiniChart';
import './AdminDashboardPage.css';

const revenueData = [120, 85, 140, 190, 165, 210, 195, 230, 180, 250, 220, 275, 260, 310];
const revLabels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'];
const signupData = [3, 5, 2, 7, 4, 6, 8, 5, 9, 6, 7, 4, 8, 11];

const tenantHealthMap = [
    { name: 'Acme Corp', slug: 'acme', status: 'active' as const, users: 12, balance: 240.50 },
    { name: 'CloudBase', slug: 'cloudbase', status: 'active' as const, users: 8, balance: 120.00 },
    { name: 'DevStudio', slug: 'devstudio', status: 'grace_period' as const, users: 5, balance: 2.30 },
    { name: 'EduPortal', slug: 'eduportal', status: 'active' as const, users: 22, balance: 580.00 },
    { name: 'MediCare', slug: 'medicare', status: 'suspended' as const, users: 3, balance: 0.00 },
    { name: 'RetailHub', slug: 'retailhub', status: 'active' as const, users: 15, balance: 340.00 },
    { name: 'LogiTrack', slug: 'logitrack', status: 'active' as const, users: 6, balance: 45.00 },
    { name: 'FinEdge', slug: 'finedge', status: 'grace_period' as const, users: 4, balance: 0.80 },
];

const platformEvents = [
    { icon: '🏢', text: 'New tenant "LogiTrack" created', time: '12 min ago', type: 'tenancy' as const },
    { icon: '👤', text: 'User registered: alex@logitrack.io', time: '12 min ago', type: 'auth' as const },
    { icon: '💰', text: 'Wallet top-up: Acme Corp — $100.00', time: '45 min ago', type: 'billing' as const },
    { icon: '⚠️', text: 'Tenant "MediCare" suspended (zero balance)', time: '2 hours ago', type: 'billing' as const },
    { icon: '💰', text: 'Wallet top-up: EduPortal — $200.00', time: '3 hours ago', type: 'billing' as const },
    { icon: '🏢', text: 'New tenant "FinEdge" created', time: '5 hours ago', type: 'tenancy' as const },
    { icon: '📦', text: 'Plugin "Hospital OPD" deployed to production', time: '1 day ago', type: 'plugin' as const },
];

const statusColor = { active: 'var(--accent-success)', grace_period: 'var(--accent-warning)', suspended: 'var(--accent-danger)' };

export function AdminDashboardPage() {
    return (
        <div className="admin-dash animate-fadeIn">
            <div className="page-header-row">
                <div>
                    <h1 className="page-title">Platform Admin</h1>
                    <p className="page-subtitle">System-wide metrics and tenant health overview</p>
                </div>
                <span className="admin-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    Platform Admin
                </span>
            </div>

            {/* Platform Metrics */}
            <div className="stats-row">
                <StatCard
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>}
                    label="Total Tenants"
                    value="8"
                    trend={{ value: '+2 this week', positive: true }}
                    variant="accent"
                />
                <StatCard
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
                    label="Total Users"
                    value="75"
                    trend={{ value: '+11 this month', positive: true }}
                    variant="success"
                />
                <StatCard
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
                    label="Active Tenants"
                    value="6"
                    variant="success"
                />
                <StatCard
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
                    label="Monthly Revenue"
                    value="$1,328"
                    trend={{ value: '+18.5%', positive: true }}
                    variant="accent"
                />
            </div>

            {/* Charts */}
            <div className="admin-charts">
                <div className="chart-card glass-card">
                    <div className="chart-header">
                        <h3 className="chart-title">Revenue (14 days)</h3>
                        <span className="chart-period">Daily wallet top-ups</span>
                    </div>
                    <div className="chart-body">
                        <BarChart data={revenueData} labels={revLabels} color="var(--accent-primary)" height={140} />
                    </div>
                    <div className="chart-footer">
                        <span className="chart-total">Total: $2,830</span>
                        <span className="chart-avg">Avg: $202/day</span>
                    </div>
                </div>

                <div className="chart-card glass-card">
                    <div className="chart-header">
                        <h3 className="chart-title">New Signups</h3>
                        <span className="chart-period">Users / day</span>
                    </div>
                    <div className="chart-body">
                        <Sparkline data={signupData} color="var(--accent-success)" height={140} />
                    </div>
                    <div className="chart-footer">
                        <span className="chart-total">Today: 11 new users</span>
                        <span className="chart-avg">Avg: 6/day</span>
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="admin-bottom">
                {/* Tenant Health Map */}
                <div className="health-map glass-card">
                    <div className="activity-header">
                        <h3 className="chart-title">Tenant Health Map</h3>
                        <div className="health-legend">
                            <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--accent-success)' }} />Active</span>
                            <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--accent-warning)' }} />Grace</span>
                            <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--accent-danger)' }} />Suspended</span>
                        </div>
                    </div>
                    <div className="tenant-health-grid">
                        {tenantHealthMap.map((t) => (
                            <div key={t.slug} className="tenant-health-tile" style={{ borderLeftColor: statusColor[t.status] }}>
                                <div className="th-header">
                                    <span className="th-name">{t.name}</span>
                                    <span className="th-badge" style={{ background: statusColor[t.status] + '22', color: statusColor[t.status] }}>
                                        {t.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="th-metrics">
                                    <span>{t.users} users</span>
                                    <span>${t.balance.toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Platform Events */}
                <div className="admin-events glass-card">
                    <div className="activity-header">
                        <h3 className="chart-title">Platform Events</h3>
                    </div>
                    <div className="activity-timeline">
                        {platformEvents.map((ev, i) => (
                            <div key={i} className="timeline-item">
                                <div className="timeline-icon">{ev.icon}</div>
                                <div className="timeline-content">
                                    <span className="timeline-text">{ev.text}</span>
                                    <span className="timeline-time">{ev.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Resource Gauges */}
            <div className="gauge-row glass-card">
                <h3 className="chart-title" style={{ marginBottom: 'var(--space-md)' }}>System Resources</h3>
                <div className="gauge-grid">
                    <Gauge value={35} max={100} label="CPU" color="var(--accent-success)" />
                    <Gauge value={62} max={100} label="Memory" color="var(--accent-primary)" />
                    <Gauge value={18} max={50} label="DB Conns" color="var(--accent-warning)" />
                    <Gauge value={2} max={10} label="Workers" color="var(--accent-info)" />
                </div>
            </div>
        </div>
    );
}
