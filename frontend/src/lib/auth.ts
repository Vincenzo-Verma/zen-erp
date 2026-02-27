import { apiRequest } from './api';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    full_name?: string;
}

export interface AuthResponse {
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

export interface VerifyResponse {
    valid: boolean;
    user_id: string;
    email: string;
    roles: string[];
}

export function loginUser(data: LoginRequest): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/api/v1/auth/login', {
        method: 'POST',
        body: data,
    });
}

export function registerUser(data: RegisterRequest): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/api/v1/auth/register', {
        method: 'POST',
        body: data,
    });
}

export function verifyToken(token: string): Promise<VerifyResponse> {
    return apiRequest<VerifyResponse>('/api/v1/auth/verify', {
        method: 'POST',
        body: { token },
    });
}
