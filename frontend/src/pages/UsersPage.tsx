import { useState } from 'react';
import { InviteUserModal } from '../components/InviteUserModal';
import './UsersPage.css';

const mockMembers = [
    { id: '1', name: 'You (Owner)', email: 'admin@acme.com', role: 'admin', status: 'active', joinedAt: '2026-01-15' },
    { id: '2', name: 'John Smith', email: 'john@acme.com', role: 'member', status: 'active', joinedAt: '2026-02-10' },
    { id: '3', name: 'Lisa Chen', email: 'lisa@acme.com', role: 'member', status: 'active', joinedAt: '2026-02-12' },
    { id: '4', name: 'Raj Patel', email: 'raj@acme.com', role: 'viewer', status: 'active', joinedAt: '2026-02-18' },
];

export function UsersPage() {
    const [showInvite, setShowInvite] = useState(false);

    const handleInvite = async (email: string, role: string) => {
        // Placeholder — in production, calls addUserToTenant
        console.log('Invite:', email, role);
        await new Promise((r) => setTimeout(r, 500));
    };

    return (
        <div className="users-page animate-fadeIn">
            <div className="page-header-row">
                <div>
                    <h1 className="page-title">Users & Roles</h1>
                    <p className="page-subtitle">Manage team members and their roles in this organization</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowInvite(true)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="8.5" cy="7" r="4" />
                        <line x1="20" y1="8" x2="20" y2="14" />
                        <line x1="23" y1="11" x2="17" y2="11" />
                    </svg>
                    Invite User
                </button>
            </div>

            <div className="users-table-card glass-card">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockMembers.map((m) => (
                            <tr key={m.id}>
                                <td>
                                    <div className="user-cell">
                                        <div className="user-cell-avatar">{m.name.charAt(0)}</div>
                                        <div className="user-cell-info">
                                            <span className="user-cell-name">{m.name}</span>
                                            <span className="user-cell-email">{m.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge badge-${m.role === 'admin' ? 'active' : m.role === 'viewer' ? 'free' : 'active'}`}>
                                        {m.role}
                                    </span>
                                </td>
                                <td><span className="badge badge-active">{m.status}</span></td>
                                <td className="date-cell">{m.joinedAt}</td>
                                <td>
                                    {m.role === 'admin' ? (
                                        <button className="btn btn-ghost btn-sm" disabled>Owner</button>
                                    ) : (
                                        <div className="row-actions">
                                            <button className="btn btn-ghost btn-sm" title="Edit role">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </button>
                                            <button className="btn btn-ghost btn-sm btn-danger-text" title="Remove user">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <InviteUserModal
                isOpen={showInvite}
                onClose={() => setShowInvite(false)}
                onInvite={handleInvite}
            />
        </div>
    );
}
