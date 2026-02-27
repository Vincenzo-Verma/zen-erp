import { apiRequest } from './api';

export interface Tenant {
    id: string;
    name: string;
    slug: string;
    type: string;       // school, clinic, etc.
    domain?: string;     // custom domain
    prefix?: string;
    status: string;
    plan_tier: string;
    created_at: string;
}

export interface CreateTenantRequest {
    name: string;
    slug: string;
    owner_user_id: string;
    type?: string;       // defaults to 'school'
    domain?: string;     // optional custom domain
}

export interface CreateTenantResponse {
    success: boolean;
    message: string;
    tenant: Tenant;
    suggestions?: string[];
}

export class TenantConflictError extends Error {
    suggestions: string[];
    constructor(message: string, suggestions: string[]) {
        super(message);
        this.name = 'TenantConflictError';
        this.suggestions = suggestions;
        Object.setPrototypeOf(this, TenantConflictError.prototype);
    }
}

export interface GetTenantResponse {
    success: boolean;
    message: string;
    tenant: Tenant;
}

export interface ListTenantsResponse {
    tenants: Tenant[];
}

export interface AddUserRequest {
    user_id: string;
    role: string;
}

export interface AddUserResponse {
    success: boolean;
    message: string;
}

export async function createTenant(
    data: CreateTenantRequest,
    token: string
): Promise<CreateTenantResponse> {
    const res = await apiRequest<CreateTenantResponse>('/api/v1/tenants', {
        method: 'POST',
        body: data,
        token,
    });
    if (!res.success) {
        throw new TenantConflictError(res.message, res.suggestions || []);
    }
    return res;
}

export function getTenant(id: string, token: string): Promise<GetTenantResponse> {
    return apiRequest<GetTenantResponse>(`/api/v1/tenants/${id}`, { token });
}

export function getUserTenants(
    userId: string,
    token: string
): Promise<ListTenantsResponse> {
    return apiRequest<ListTenantsResponse>(`/api/v1/tenants/user/${userId}`, {
        token,
    });
}

export function addUserToTenant(
    tenantId: string,
    data: AddUserRequest,
    token: string
): Promise<AddUserResponse> {
    return apiRequest<AddUserResponse>(`/api/v1/tenants/${tenantId}/users`, {
        method: 'POST',
        body: data,
        token,
    });
}
