const BASE_URL = '';

interface RequestOptions {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    token?: string | null;
}

interface ApiError {
    message: string;
    status: number;
}

export class ApiRequestError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = 'ApiRequestError';
        this.status = status;
    }
}

export async function apiRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const { method = 'GET', body, headers = {}, token } = options;

    const reqHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
    };

    if (token) {
        reqHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        method,
        headers: reqHeaders,
    };

    if (body && method !== 'GET') {
        config.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        try {
            const errorData = await response.json() as ApiError;
            errorMessage = errorData.message || errorMessage;
        } catch {
            // Use default message
        }
        throw new ApiRequestError(errorMessage, response.status);
    }

    const text = await response.text();
    if (!text) return {} as T;

    return JSON.parse(text) as T;
}
