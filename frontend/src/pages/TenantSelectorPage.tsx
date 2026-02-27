import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useTenantStore } from '../stores/useTenantStore';
import { CreateTenantModal } from '../components/CreateTenantModal';
import type { Tenant } from '../lib/tenants';
import './TenantSelectorPage.css';

export function TenantSelectorPage() {
    const navigate = useNavigate();
    const { userId, token } = useAuthStore();
    const { tenants, isLoading, loadTenants, setActiveTenant, createTenant, error } = useTenantStore();
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (userId && token) {
            loadTenants(userId, token);
        }
    }, [userId, token, loadTenants]);

    const handleSelect = (tenant: Tenant) => {
        setActiveTenant(tenant);
        navigate('/');
    };

    const handleCreate = async (name: string, slug: string) => {
        if (!userId || !token) return;
        const tenant = await createTenant({ name, slug, owner_user_id: userId }, token);
        setActiveTenant(tenant);
        navigate('/');
    };

    return (
        <div className="tenant-selector-page">
            <div className="gradient-bg" />
            <div className="tenant-selector-content animate-fadeIn">
                <div className="tenant-selector-header">
                    <h1 className="tenant-selector-title">Select Organization</h1>
                    <p className="tenant-selector-subtitle">
                        Choose a workspace to continue, or create a new one
                    </p>
                </div>

                {error && (
                    <div className="auth-error animate-scaleIn">
                        <span>{error}</span>
                    </div>
                )}

                {isLoading ? (
                    <div className="tenant-loading">
                        <span className="spinner" />
                        <span>Loading organizations...</span>
                    </div>
                ) : (
                    <div className="tenant-grid">
                        {tenants.map((tenant) => (
                            <div
                                key={tenant.id}
                                className="tenant-card glass-card"
                                onClick={() => handleSelect(tenant)}
                            >
                                <div className="tenant-card-avatar">
                                    {tenant.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="tenant-card-info">
                                    <h3 className="tenant-card-name">{tenant.name}</h3>
                                    <span className="tenant-card-slug">/{tenant.slug}</span>
                                </div>
                                <div className="tenant-card-meta">
                                    <span className={`badge badge-${tenant.status === 'active' ? 'active' : 'suspended'}`}>
                                        {tenant.status}
                                    </span>
                                    <span className="badge badge-free">{tenant.plan_tier}</span>
                                </div>
                                <div className="tenant-card-arrow">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </div>
                            </div>
                        ))}

                        {/* Create new org card */}
                        <div
                            className="tenant-card tenant-card-create glass-card"
                            onClick={() => setShowModal(true)}
                        >
                            <div className="tenant-card-avatar tenant-card-avatar-create">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                            </div>
                            <div className="tenant-card-info">
                                <h3 className="tenant-card-name">Create Organization</h3>
                                <span className="tenant-card-slug">Set up a new workspace</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <CreateTenantModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={handleCreate}
            />
        </div>
    );
}
