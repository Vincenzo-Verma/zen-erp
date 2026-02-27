import { Navigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useTenantStore } from '../stores/useTenantStore';

interface Props {
    children: React.ReactNode;
    requireTenant?: boolean;
}

export function ProtectedRoute({ children, requireTenant = false }: Props) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const activeTenant = useTenantStore((s) => s.activeTenant);
    const { slug } = useParams<{ slug: string }>();

    if (!isAuthenticated) {
        if (slug) {
            return <Navigate to={`/school/${slug}/login`} replace />;
        }
        return <Navigate to="/login" replace />;
    }

    if (requireTenant && !activeTenant) {
        return <Navigate to="/schools" replace />;
    }

    return <>{children}</>;
}
