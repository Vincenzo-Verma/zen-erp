import { useTenantStore } from '../stores/useTenantStore';
import { StatCard } from '../components/StatCard';
import { BarChart, Sparkline } from '../components/MiniChart';
import './DashboardPage.css';

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const costData = [1.2, 0.8, 1.5, 1.1, 0.9, 0.3, 0.5];
const activityData = [12, 18, 15, 22, 19, 8, 14];

const recentActivity = [
    { type: 'auth', icon: '🔐', text: 'New user registered', user: 'admin', time: '2 min ago' },
    { type: 'tenancy', icon: '🏢', text: 'Organization settings updated', user: 'admin', time: '15 min ago' },
    { type: 'billing', icon: '💰', text: 'Wallet topped up — $50.00', user: 'admin', time: '1 hour ago' },
    { type: 'plugin', icon: '📦', text: 'School Management plugin activated', user: 'system', time: '3 hours ago' },
    { type: 'auth', icon: '👤', text: 'User role updated to Admin', user: 'admin', time: '5 hours ago' },
    { type: 'tenancy', icon: '🏢', text: 'New member invited', user: 'admin', time: 'Yesterday' },
];

export function DashboardPage() {
    const activeTenant = useTenantStore((s) => s.activeTenant);

    return (
        <div className="dashboard animate-fadeIn">
            {/* Welcome Hero */}
            <div className="dashboard-hero glass-card">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Welcome back! 👋
                    </h1>
                    <p className="hero-subtitle">
                        Here's what's happening with <strong>{activeTenant?.name || 'your workspace'}</strong> today.
                    </p>
                </div>
                <div className="hero-visual">
                    <div className="hero-orb hero-orb-1" />
                    <div className="hero-orb hero-orb-2" />
                </div>
            </div>

            {/* Stats Row */}
            <div className="stats-row">
                <StatCard
                    icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    }
                    label="Team Members"
                    value="4"
                    trend={{ value: '+1 this week', positive: true }}
                    variant="accent"
                />
                <StatCard
                    icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                            <line x1="1" y1="10" x2="23" y2="10" />
                        </svg>
                    }
                    label="Wallet Balance"
                    value="$50.00"
                    trend={{ value: '$1.20/day burn', positive: false }}
                    variant="success"
                />
                <StatCard
                    icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    }
                    label="Uptime"
                    value="99.9%"
                    trend={{ value: 'Last 30 days', positive: true }}
                    variant="success"
                />
                <StatCard
                    icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                            <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" />
                        </svg>
                    }
                    label="Active Plugins"
                    value="2"
                    variant="warning"
                />
            </div>

            {/* Charts Row */}
            <div className="charts-row">
                {/* Daily Cost Chart */}
                <div className="chart-card glass-card">
                    <div className="chart-header">
                        <h3 className="chart-title">Daily Cost</h3>
                        <span className="chart-period">Last 7 days</span>
                    </div>
                    <div className="chart-body">
                        <BarChart
                            data={costData}
                            labels={weekDays}
                            color="var(--accent-primary)"
                            height={120}
                        />
                    </div>
                    <div className="chart-footer">
                        <span className="chart-total">Total: $6.30</span>
                        <span className="chart-avg">Avg: $0.90/day</span>
                    </div>
                </div>

                {/* User Activity Chart */}
                <div className="chart-card glass-card">
                    <div className="chart-header">
                        <h3 className="chart-title">User Activity</h3>
                        <span className="chart-period">API requests / day</span>
                    </div>
                    <div className="chart-body">
                        <Sparkline data={activityData} color="var(--accent-success)" height={120} />
                    </div>
                    <div className="chart-footer">
                        <span className="chart-total">Today: 14 requests</span>
                        <span className="chart-avg">Peak: 22</span>
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="bottom-row">
                {/* Recent Activity */}
                <div className="activity-card glass-card">
                    <div className="activity-header">
                        <h3 className="chart-title">Recent Activity</h3>
                        <button className="btn btn-ghost btn-sm">View All</button>
                    </div>
                    <div className="activity-timeline">
                        {recentActivity.map((item, i) => (
                            <div key={i} className="timeline-item animate-slideIn" style={{ animationDelay: `${i * 50}ms` }}>
                                <div className="timeline-icon">{item.icon}</div>
                                <div className="timeline-content">
                                    <span className="timeline-text">{item.text}</span>
                                    <div className="timeline-meta">
                                        <span className="timeline-user">{item.user}</span>
                                        <span className="timeline-time">{item.time}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* System Status + Plugins */}
                <div className="side-cards">
                    {/* Service Status */}
                    <div className="status-card glass-card">
                        <h3 className="chart-title">Service Status</h3>
                        <div className="status-grid">
                            <div className="status-item status-item-up">
                                <span className="status-dot" />
                                <span>Gateway</span>
                            </div>
                            <div className="status-item status-item-up">
                                <span className="status-dot" />
                                <span>Auth</span>
                            </div>
                            <div className="status-item status-item-up">
                                <span className="status-dot" />
                                <span>Tenancy</span>
                            </div>
                            <div className="status-item status-item-warn">
                                <span className="status-dot" />
                                <span>Billing</span>
                            </div>
                            <div className="status-item status-item-up">
                                <span className="status-dot" />
                                <span>Event Bus</span>
                            </div>
                            <div className="status-item status-item-off">
                                <span className="status-dot" />
                                <span>School Plugin</span>
                            </div>
                        </div>
                    </div>

                    {/* Plugin Widgets */}
                    <div className="plugin-widget glass-card">
                        <div className="plugin-widget-header">
                            <span className="plugin-widget-icon">🏫</span>
                            <h3 className="chart-title">School Management</h3>
                        </div>
                        <div className="plugin-widget-stats">
                            <div className="pw-stat">
                                <span className="pw-val">128</span>
                                <span className="pw-label">Students</span>
                            </div>
                            <div className="pw-stat">
                                <span className="pw-val">12</span>
                                <span className="pw-label">Teachers</span>
                            </div>
                            <div className="pw-stat">
                                <span className="pw-val">92%</span>
                                <span className="pw-label">Attendance</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
