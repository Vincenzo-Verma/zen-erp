import { createContext, useContext, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTenantStore } from '../stores/useTenantStore';

export type PortalType = 'admin' | 'staff' | 'student' | 'super_admin';

interface SchoolContextValue {
    slug: string | null;
    portalType: PortalType;
    userRole: string;
    currentSchool: {
        id: string;
        name: string;
        slug: string;
        status: string;
    } | null;
}

const SchoolCtx = createContext<SchoolContextValue>({
    slug: null,
    portalType: 'super_admin',
    userRole: '',
    currentSchool: null,
});

export function SchoolProvider({ children }: { children: React.ReactNode }) {
    const { slug } = useParams<{ slug: string }>();
    const tenants = useTenantStore((s) => s.tenants);
    const loadTenants = useTenantStore((s) => s.loadTenants);

    // Load tenants from API if not already in store
    useEffect(() => {
        if (tenants.length === 0) {
            const userId = localStorage.getItem('erp_user_id');
            const token = localStorage.getItem('erp_token');
            if (userId && token) {
                loadTenants(userId, token);
            }
        }
    }, [tenants.length, loadTenants]);

    const userRole = useMemo(() => {
        return localStorage.getItem('erp_school_role') || '';
    }, [slug]);

    const portalType = useMemo<PortalType>(() => {
        if (!slug) return 'super_admin';
        switch (userRole) {
            case 'admin': return 'admin';
            case 'teacher':
            case 'receptionist':
            case 'accountant': return 'staff';
            case 'student':
            case 'parent': return 'student';
            default: return 'admin';
        }
    }, [slug, userRole]);

    const currentSchool = useMemo(() => {
        if (!slug) return null;
        // First try the tenant store
        const found = tenants.find((t) => t.slug === slug);
        if (found) return { id: found.id, name: found.name, slug: found.slug, status: found.status };
        // Fallback: try localStorage (set at login time)
        try {
            const stored = localStorage.getItem('erp_active_tenant');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.slug === slug && parsed.id) {
                    return { id: parsed.id, name: parsed.name, slug: parsed.slug, status: parsed.status || 'active' };
                }
            }
        } catch { /* ignore */ }
        // Return null if we can't resolve the tenant — prevents empty-id requests
        return null;
    }, [slug, tenants]);

    const value = useMemo(
        () => ({ slug: slug ?? null, portalType, userRole, currentSchool }),
        [slug, portalType, userRole, currentSchool]
    );

    return <SchoolCtx.Provider value={value}>{children}</SchoolCtx.Provider>;
}

export function useSchoolContext() {
    return useContext(SchoolCtx);
}
