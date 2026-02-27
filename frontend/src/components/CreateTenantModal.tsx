import { useState } from 'react';
import './CreateTenantModal.css';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string, slug: string) => Promise<void>;
}

export function CreateTenantModal({ isOpen, onClose, onSubmit }: Props) {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);

    if (!isOpen) return null;

    const handleNameChange = (val: string) => {
        setName(val);
        setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
        setSuggestions([]);
        setError('');
    };

    const handlePickSuggestion = (suggested: string) => {
        setSlug(suggested);
        const derived = suggested.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        setName(derived);
        setSuggestions([]);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !slug.trim()) return;
        setLoading(true);
        setError('');
        setSuggestions([]);
        try {
            await onSubmit(name.trim(), slug.trim());
            setName('');
            setSlug('');
            onClose();
        } catch (err: unknown) {
            const e = err as Record<string, unknown>;
            if (e && Array.isArray(e.suggestions)) {
                setError(String(e.message ?? 'Name already taken'));
                setSuggestions(e.suggestions as string[]);
            } else {
                setError(err instanceof Error ? err.message : 'Failed to create tenant');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-card animate-scaleIn" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Create New Organization</h2>
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
                            <label className="form-label" htmlFor="tenant-name">Organization Name</label>
                            <input
                                id="tenant-name"
                                className="form-input"
                                type="text"
                                placeholder="e.g. Acme Corp"
                                value={name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                autoFocus
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="tenant-slug">Slug (URL-safe identifier)</label>
                            <input
                                id="tenant-slug"
                                className="form-input"
                                type="text"
                                placeholder="e.g. acme-corp"
                                value={slug}
                                onChange={(e) => { setSlug(e.target.value); setSuggestions([]); setError(''); }}
                                required
                            />
                        </div>

                        {error && <p className="form-error">{error}</p>}

                        {suggestions.length > 0 && (
                            <div className="slug-suggestions">
                                <p className="suggestions-label">Available alternatives:</p>
                                <div className="suggestions-list">
                                    {suggestions.map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            className="suggestion-chip"
                                            onClick={() => handlePickSuggestion(s)}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading || !name || !slug}>
                            {loading ? <span className="spinner" /> : null}
                            Create Organization
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
