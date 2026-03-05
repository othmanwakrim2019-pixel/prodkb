/**
 * Auth API Service — login, refresh, logout, profile
 * Tokens are now stored in httpOnly cookies — no token handling needed on the frontend.
 */
import api from '../utils/axios';

export interface LoginResponse {
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        permissions: string[];
    };
}

export const authService = {
    login: (email: string, password: string): Promise<LoginResponse> =>
        api.post('/auth/v1/login', { email, password }).then(r => r.data),

    // Refresh is handled automatically via httpOnly cookies
    refresh: (): Promise<void> =>
        api.post('/auth/v1/refresh').then(() => undefined),

    // Logout clears httpOnly cookies on the backend
    logout: (): Promise<void> =>
        api.post('/auth/v1/logout'),

    getMe: (): Promise<LoginResponse['user']> =>
        api.get('/auth/v1/me').then(r => r.data),
};

