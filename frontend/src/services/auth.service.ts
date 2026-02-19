/**
 * Auth API Service — login, refresh, logout, profile
 * Handles refresh token rotation
 */
import { api } from '../lib/api';

export interface LoginResponse {
    token: string;
    refreshToken: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        permissions: string[];
    };
}

export interface RefreshResponse {
    token: string;
    refreshToken: string;
}

export const authService = {
    login: (email: string, password: string): Promise<LoginResponse> =>
        api.post('/auth/v1/login', { email, password }).then(r => r.data),

    refresh: (refreshToken: string): Promise<RefreshResponse> =>
        api.post('/auth/v1/refresh', { refreshToken }).then(r => r.data),

    logout: (refreshToken?: string): Promise<void> =>
        api.post('/auth/v1/logout', { refreshToken }),

    getMe: (): Promise<LoginResponse['user']> =>
        api.get('/auth/v1/me').then(r => r.data),
};
