import { useAuthStore } from '../stores/useAuthStore';
import { useTenantStore } from '../stores/useTenantStore';
import './UserProfilePage.css';

export function UserProfilePage() {
    const { email, userId } = useAuthStore();
    const { tenants } = useTenantStore();

    const initials = email ? email.charAt(0).toUpperCase() : '?';

    return (
        <div className="profile-page animate-fadeIn">
            <div className="page-header-row">
                <div>
                    <h1 className="page-title">My Profile</h1>
                    <p className="page-subtitle">Manage your personal information and security</p>
                </div>
            </div>

            {/* Profile Card */}
            <div className="profile-hero glass-card">
                <div className="profile-avatar-large">{initials}</div>
                <div className="profile-hero-info">
                    <h2 className="profile-name">{email?.split('@')[0] || 'User'}</h2>
                    <span className="profile-email">{email}</span>
                    <span className="profile-id">ID: {userId?.slice(0, 8)}...</span>
                </div>
            </div>

            <div className="profile-grid">
                {/* Personal Info */}
                <div className="profile-section glass-card">
                    <h3 className="profile-section-title">Personal Information</h3>
                    <div className="settings-form">
                        <div className="form-group">
                            <label className="form-label">Display Name</label>
                            <input className="form-input" type="text" placeholder="Enter your name" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input className="form-input" type="email" defaultValue={email || ''} readOnly />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Timezone</label>
                            <select className="form-input">
                                <option>Asia/Kolkata (UTC+5:30)</option>
                                <option>America/New_York (UTC-5)</option>
                                <option>Europe/London (UTC+0)</option>
                                <option>Asia/Tokyo (UTC+9)</option>
                            </select>
                        </div>
                        <div className="settings-actions">
                            <button className="btn btn-primary btn-sm">Save Changes</button>
                        </div>
                    </div>
                </div>

                {/* Security */}
                <div className="profile-section glass-card">
                    <h3 className="profile-section-title">Security</h3>
                    <div className="settings-form">
                        <div className="form-group">
                            <label className="form-label">Current Password</label>
                            <input className="form-input" type="password" placeholder="••••••••" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">New Password</label>
                            <input className="form-input" type="password" placeholder="Min 8 characters" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm New Password</label>
                            <input className="form-input" type="password" placeholder="Re-enter new password" />
                        </div>
                        <div className="settings-actions">
                            <button className="btn btn-secondary btn-sm">Change Password</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Organizations */}
            <div className="profile-section glass-card">
                <h3 className="profile-section-title">My Organizations</h3>
                <div className="org-list">
                    {tenants.length === 0 ? (
                        <p className="text-muted">You're not a member of any organization yet.</p>
                    ) : (
                        tenants.map((t) => (
                            <div key={t.id} className="org-item">
                                <div className="org-avatar">{t.name.charAt(0).toUpperCase()}</div>
                                <div className="org-info">
                                    <span className="org-name">{t.name}</span>
                                    <span className="org-slug">/{t.slug}</span>
                                </div>
                                <span className={`badge badge-${t.status === 'active' ? 'active' : 'suspended'}`}>
                                    {t.status}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Active Sessions */}
            <div className="profile-section glass-card">
                <h3 className="profile-section-title">Active Sessions</h3>
                <div className="session-list">
                    <div className="session-item">
                        <div className="session-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                                <line x1="8" y1="21" x2="16" y2="21" />
                                <line x1="12" y1="17" x2="12" y2="21" />
                            </svg>
                        </div>
                        <div className="session-info">
                            <span className="session-device">Linux Desktop — Chrome</span>
                            <span className="session-meta">Current session · 192.168.1.42</span>
                        </div>
                        <span className="badge badge-active">Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
