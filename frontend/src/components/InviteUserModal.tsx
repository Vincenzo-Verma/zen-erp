import { useState } from 'react';
import './InviteUserModal.css';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onInvite: (email: string, role: string) => Promise<void>;
}

const roles = [
    { value: 'admin', label: 'Admin', desc: 'Full access to all features and settings' },
    { value: 'member', label: 'Member', desc: 'Standard access to installed plugins' },
    { value: 'viewer', label: 'Viewer', desc: 'Read-only access to data and reports' },
];

export function InviteUserModal({ isOpen, onClose, onInvite }: Props) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('member');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        setLoading(true);
        setError('');
        try {
            await onInvite(email.trim(), role);
            setEmail('');
            setRole('member');
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to invite user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-card animate-scaleIn" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Invite Team Member</h2>
                    <button className="modal-close btn-ghost" onClick={onClose} aria-label="Close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label" htmlFor="invite-email">Email Address</label>
                            <input
                                id="invite-email"
                                className="form-input"
                                type="email"
                                placeholder="colleague@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoFocus
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <div className="role-picker">
                                {roles.map((r) => (
                                    <label
                                        key={r.value}
                                        className={`role-option ${role === r.value ? 'role-selected' : ''}`}
                                    >
                                        <input
                                            type="radio"
                                            name="role"
                                            value={r.value}
                                            checked={role === r.value}
                                            onChange={() => setRole(r.value)}
                                        />
                                        <div className="role-option-content">
                                            <span className="role-option-label">{r.label}</span>
                                            <span className="role-option-desc">{r.desc}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {error && <p className="form-error">{error}</p>}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading || !email}>
                            {loading ? <span className="spinner" /> : null}
                            Send Invite
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
