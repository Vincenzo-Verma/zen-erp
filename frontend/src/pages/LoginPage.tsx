import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { AuthLayout } from '../components/AuthLayout';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, isLoading, error, clearError } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const res = await login({ email, password });
            if (res && res.redirect) {
                navigate(res.redirect);
            } else {
                navigate('/schools');
            }
        } catch {
            // error is set in store
        }
    };

    return (
        <AuthLayout
            title="Welcome"
            subtitle="Please enter your credentials to sign in"
            footer={
                <p className="mb-0">
                    Don't have an account?{' '}
                    <Link to="/register" className="link-primary">Create Account</Link>
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
                    <label className="form-label">Email Address</label>
                    <div className="input-icon position-relative">
                        <span className="input-icon-addon"><i className="ti ti-mail" /></span>
                        <input type="email" className="form-control" placeholder="Enter your email"
                            value={email} onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email" required autoFocus />
                    </div>
                </div>

                <div className="mb-3">
                    <label className="form-label">Password</label>
                    <div className="pass-group position-relative">
                        <input type={showPassword ? 'text' : 'password'} className="form-control pass-input"
                            placeholder="Enter your password" value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password" required />
                        <span className={`ti toggle-password ${showPassword ? 'ti-eye' : 'ti-eye-off'}`}
                            onClick={() => setShowPassword(!showPassword)} />
                    </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="form-check">
                        <input type="checkbox" className="form-check-input" id="rememberMe" />
                        <label className="form-check-label" htmlFor="rememberMe">Remember me</label>
                    </div>
                    <Link to="/forgot-password" className="link-primary">Forgot password?</Link>
                </div>

                <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
                    {isLoading ? <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" /> : null}
                    Sign In
                </button>
            </form>
        </AuthLayout>
    );
}
