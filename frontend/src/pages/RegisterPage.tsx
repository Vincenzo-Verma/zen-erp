import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { AuthLayout } from '../components/AuthLayout';

export function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const { register, isLoading, error, clearError } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await register({ email, password, full_name: fullName || undefined });
            navigate('/schools');
        } catch {
            // error is set in store
        }
    };

    return (
        <AuthLayout
            title="Create Account"
            subtitle="Fill in the details below to get started"
            overlayTitle="Get Started with Preskool"
            overlaySubtitle="Create your organization and start managing school operations."
            footer={
                <p className="mb-0">
                    Already have an account?{' '}
                    <Link to="/login" className="link-primary">Sign in</Link>
                </p>
            }
        >
            {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button type="button" className="btn-close" onClick={clearError} aria-label="Close" />
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label" htmlFor="reg-name">Full Name</label>
                    <input
                        id="reg-name"
                        className="form-control"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        autoComplete="name"
                        autoFocus
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label" htmlFor="reg-email">Email Address</label>
                    <input
                        id="reg-email"
                        className="form-control"
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label" htmlFor="reg-password">Password</label>
                    <input
                        id="reg-password"
                        className="form-control"
                        type="password"
                        placeholder="Min 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                        minLength={8}
                    />
                </div>

                <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
                    {isLoading ? <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" /> : null}
                    Create Account
                </button>
            </form>
        </AuthLayout>
    );
}
