import api from '../../../utils/axios';
import { unwrapObject } from '../../../utils/api-response';

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: string;
    permissions: string[];
}

export interface LoginResponse {
    user: AuthUser;
}

export const authService = {
    login: (email: string, password: string): Promise<LoginResponse> =>
        api.post('/auth/v1/login', { email, password }).then((response) =>
            unwrapObject<LoginResponse>(response.data) as LoginResponse
        ),

    refresh: (): Promise<void> =>
        api.post('/auth/v1/refresh').then(() => undefined),

    logout: (): Promise<void> =>
        api.post('/auth/v1/logout').then(() => undefined),

    getMe: (): Promise<AuthUser> =>
        api.get('/auth/v1/me').then((response) => unwrapObject<AuthUser>(response.data) as AuthUser),

    changePassword: (data: { currentPassword: string; newPassword: string }): Promise<void> =>
        api.put('/api/v1/users/me/password', data).then(() => undefined),
};
