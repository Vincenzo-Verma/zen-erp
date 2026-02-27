import { create } from 'zustand';
import {
    getUserTenants,
    createTenant as apiCreateTenant,
    type Tenant,
    type CreateTenantRequest,
} from '../lib/tenants';

interface TenantState {
    activeTenant: Tenant | null;
    tenants: Tenant[];
    isLoading: boolean;
    error: string | null;

    setActiveTenant: (tenant: Tenant) => void;
    loadTenants: (userId: string, token: string) => Promise<void>;
    createTenant: (data: CreateTenantRequest, token: string) => Promise<Tenant>;
    clearTenant: () => void;
    clearError: () => void;
}

export const useTenantStore = create<TenantState>((set, get) => ({
    activeTenant: null,
    tenants: [],
    isLoading: false,
    error: null,

    setActiveTenant: (tenant) => {
        localStorage.setItem('erp_active_tenant', JSON.stringify(tenant));
        set({ activeTenant: tenant });
    },

    loadTenants: async (userId, token) => {
        set({ isLoading: true, error: null });
        try {
            const res = await getUserTenants(userId, token);
            set({ tenants: res.tenants || [], isLoading: false });

            // Try to restore active tenant from localStorage
            const stored = localStorage.getItem('erp_active_tenant');
            if (stored && !get().activeTenant) {
                try {
                    const parsed = JSON.parse(stored) as Tenant;
                    const found = (res.tenants || []).find((t) => t.id === parsed.id);
                    if (found) {
                        set({ activeTenant: found });
                    }
                } catch {
                    // ignore
                }
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to load tenants';
            set({ isLoading: false, error: msg });
        }
    },

    createTenant: async (data, token) => {
        set({ isLoading: true, error: null });
        try {
            const res = await apiCreateTenant(data, token);
            set((state) => ({
                tenants: [...state.tenants, res.tenant],
                isLoading: false,
            }));
            return res.tenant;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to create tenant';
            set({ isLoading: false, error: msg });
            throw err;
        }
    },

    clearTenant: () => {
        localStorage.removeItem('erp_active_tenant');
        set({ activeTenant: null, tenants: [] });
    },

    clearError: () => set({ error: null }),
}));
