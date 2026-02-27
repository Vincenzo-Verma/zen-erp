import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { apiRequest } from '../lib/api';
import { AuthLayout } from '../components/AuthLayout';

interface SchoolLoginResponse {
    success: boolean;
    message: string;
    token?: string;
    user_id?: string;
    school?: {
        id: string;
        name: string;
        slug: string;
        status: string;
    };
    role?: string;
    portal?: string;
    redirect?: string;
}

export function SchoolLoginPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [schoolName, setSchoolName] = useState('');

    useEffect(() => {
        if (slug) {
            setSchoolName(slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
        }
    }, [slug]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!slug) return;

        setLoading(true);
        setError('');

        try {
            const res = await apiRequest<SchoolLoginResponse>(
                `/api/v1/auth/login/school/${slug}`,
                { method: 'POST', body: { email, password } }
            );

            if (!res.success) {
                setError(res.message || 'Login failed');
                setLoading(false);
                return;
            }

            // Store auth state
            if (res.token && res.user_id) {
                localStorage.setItem('erp_token', res.token);
                localStorage.setItem('erp_user_id', res.user_id);
                localStorage.setItem('erp_email', email);

                // Store school context
                if (res.school) {
                    localStorage.setItem('erp_active_tenant', JSON.stringify(res.school));
                    localStorage.setItem('erp_school_role', res.role || '');
                }

                // Hydrate auth store
                useAuthStore.getState().hydrate();
            }

            // Redirect to the correct portal
            if (res.redirect) {
                navigate(res.redirect, { replace: true });
            } else {
                navigate(`/school/${slug}/portal`, { replace: true });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title={schoolName}
            subtitle="Sign in to your school portal"
            overlayTitle={schoolName}
            overlaySubtitle="Students, teachers, and admins — use the credentials provided by your school."
            footer={
                <p className="mb-0 text-muted">
                    Students, teachers, and admins — use the credentials provided by your school.
                </p>
            }
        >
            {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError('')} aria-label="Close" />
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label" htmlFor="school-email">Email Address</label>
                    <input
                        id="school-email"
                        className="form-control"
                        type="email"
                        placeholder="you@school.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                        autoFocus
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label" htmlFor="school-password">Password</label>
                    <input
                        id="school-password"
                        className="form-control"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                    />
                </div>

                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                    {loading ? <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" /> : null}
                    Sign In to {schoolName}
                </button>
            </form>
        </AuthLayout>
    );
}
