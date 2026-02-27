import { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useTenantStore } from '../stores/useTenantStore';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { apiRequest } from '../lib/api';

export function SettingsPage() {
    const email = useAuthStore((s) => s.email);
    const activeTenant = useTenantStore((s) => s.activeTenant);

    const baseDomain = import.meta.env.VITE_BASE_DOMAIN || 'localhost';
    const [customDomain, setCustomDomain] = useState(activeTenant?.domain || '');
    const [prefix, setPrefix] = useState(activeTenant?.prefix || '');
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    const handleSaveSettings = async () => {
        if (!activeTenant?.id) return;
        const token = localStorage.getItem('erp_token');
        setSaving(true);
        setSaveMessage('');
        try {
            await apiRequest(`/api/v1/tenants/${activeTenant.id}/domain`, {
                method: 'PUT', token, body: { domain: customDomain },
            });
            await apiRequest(`/api/v1/tenants/${activeTenant.id}/prefix`, {
                method: 'PUT', token, body: { prefix },
            });
            setSaveMessage('Settings saved successfully.');
        } catch (err: any) {
            setSaveMessage('');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="animate-fadeIn">
            <PageHeader
                title="Settings"
                breadcrumbs={[
                    { label: 'Dashboard', href: '../' },
                    { label: 'Settings' },
                ]}
            />

            {/* User Profile */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-transparent border-bottom">
                    <h6 className="mb-0 fw-semibold">User Profile</h6>
                </div>
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label">Email Address</label>
                            <input className="form-control" type="email" defaultValue={email || ''} readOnly />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Full Name</label>
                            <input className="form-control" type="text" placeholder="Enter your name" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <button className="btn btn-primary btn-sm">Save Changes</button>
                    </div>
                </div>
            </div>

            {/* Organization Settings */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-transparent border-bottom">
                    <h6 className="mb-0 fw-semibold">Organization Settings</h6>
                </div>
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label">Organization Name</label>
                            <input className="form-control" type="text" defaultValue={activeTenant?.name || ''} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Slug</label>
                            <input className="form-control" type="text" defaultValue={activeTenant?.slug || ''} readOnly />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Status</label>
                            <div><StatusBadge label={activeTenant?.status || 'unknown'} /></div>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Plan Tier</label>
                            <div><span className="badge badge-soft-primary">{activeTenant?.plan_tier || 'free'}</span></div>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">School Prefix <span className="text-muted">(for numbering)</span></label>
                            <input
                                className="form-control"
                                type="text"
                                placeholder="e.g., GVS"
                                value={prefix}
                                onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                                maxLength={5}
                            />
                            <small className="text-muted">
                                Used in admission/employee numbers. Format: PREFIX-S-25001
                            </small>
                        </div>
                    </div>
                    <div className="mt-3">
                        <button className="btn btn-primary btn-sm">Update Organization</button>
                    </div>
                </div>
            </div>

            {/* Student Access */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-transparent border-bottom">
                    <h6 className="mb-0 fw-semibold">Student Access</h6>
                </div>
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label">Student Portal URL</label>
                            <div className="input-group">
                                <input
                                    className="form-control"
                                    type="text"
                                    value={`${activeTenant?.slug || ''}.${baseDomain}`}
                                    readOnly
                                />
                                <button
                                    className="btn btn-outline-secondary"
                                    type="button"
                                    onClick={() => navigator.clipboard.writeText(`https://${activeTenant?.slug}.${baseDomain}`)}
                                    title="Copy URL"
                                >
                                    <i className="ti ti-copy" />
                                </button>
                            </div>
                            <small className="text-muted">
                                Share this URL with students and parents to access the school portal.
                            </small>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Custom Domain <span className="text-muted">(optional)</span></label>
                            <input
                                className="form-control"
                                type="text"
                                placeholder="e.g., portal.myschool.edu"
                                value={customDomain}
                                onChange={(e) => setCustomDomain(e.target.value)}
                            />
                            <small className="text-muted">
                                Map your own domain. CNAME it to <code>{activeTenant?.slug}.{baseDomain}</code>
                            </small>
                        </div>
                    </div>
                    {saveMessage && <div className="alert alert-success mt-3 py-2">{saveMessage}</div>}
                    <div className="mt-3">
                        <button className="btn btn-primary btn-sm" disabled={saving} onClick={handleSaveSettings}>
                            {saving ? <span className="spinner-border spinner-border-sm me-1" /> : null}
                            Save Settings
                        </button>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="card border-0 shadow-sm" style={{ borderLeft: '3px solid var(--erp-danger)' }}>
                <div className="card-header bg-transparent border-bottom">
                    <h6 className="mb-0 fw-semibold text-danger">Danger Zone</h6>
                </div>
                <div className="card-body">
                    <p className="text-muted mb-3" style={{ fontSize: 14 }}>
                        Once you delete an organization, there is no going back. Please be certain.
                    </p>
                    <button className="btn btn-danger btn-sm">Delete Organization</button>
                </div>
            </div>
        </div>
    );
}
