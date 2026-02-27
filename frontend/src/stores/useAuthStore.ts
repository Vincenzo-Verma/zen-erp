import { create } from 'zustand';
import { loginUser, registerUser, type LoginRequest, type RegisterRequest } from '../lib/auth';

interface AuthState {
    token: string | null;
    userId: string | null;
    email: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    login: (data: LoginRequest) => Promise<any>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => void;
    hydrate: () => void;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
    // Hydrate synchronously from localStorage at store creation time.
    // This ensures isAuthenticated is correct on the very first render,
    // preventing ProtectedRoute from redirecting to /login before useEffect runs.
    const savedToken = localStorage.getItem('erp_token');
    const savedUserId = localStorage.getItem('erp_user_id');
    const savedEmail = localStorage.getItem('erp_email');
    const isHydrated = !!(savedToken && savedUserId);

    return {
    token: savedToken,
    userId: savedUserId,
    email: savedEmail,
    isAuthenticated: isHydrated,
    isLoading: false,
    error: null,

    login: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const res = await loginUser(data);
            if (res.success && res.token && res.user_id) {
                localStorage.setItem('erp_token', res.token);
                localStorage.setItem('erp_user_id', res.user_id);
                localStorage.setItem('erp_email', data.email);

                if (res.school) {
                    localStorage.setItem('erp_active_tenant', JSON.stringify(res.school));
                }
                if (res.role) {
                    localStorage.setItem('erp_school_role', res.role);
                }

                set({
                    token: res.token,
                    userId: res.user_id,
                    email: data.email,
                    isAuthenticated: true,
                    isLoading: false,
                });
                return res as any; // Return full response to LoginPage for redirect
            } else {
                throw new Error(res.message || 'Login failed');
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Login failed';
            set({ isLoading: false, error: msg });
            throw err;
        }
    },

    register: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const res = await registerUser(data);
            if (res.success && res.token && res.user_id) {
                localStorage.setItem('erp_token', res.token);
                localStorage.setItem('erp_user_id', res.user_id);
                localStorage.setItem('erp_email', data.email);
                set({
                    token: res.token,
                    userId: res.user_id,
                    email: data.email,
                    isAuthenticated: true,
                    isLoading: false,
                });
            } else {
                throw new Error(res.message || 'Registration failed');
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Registration failed';
            set({ isLoading: false, error: msg });
            throw err;
        }
    },

    logout: () => {
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_user_id');
        localStorage.removeItem('erp_email');
        localStorage.removeItem('erp_active_tenant');
        set({
            token: null,
            userId: null,
            email: null,
            isAuthenticated: false,
            error: null,
        });
    },

    hydrate: () => {
        // No-op: hydration now happens synchronously at store creation.
    },

    clearError: () => set({ error: null }),
    };
});
