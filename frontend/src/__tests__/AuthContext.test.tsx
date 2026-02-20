import {
    describe, it, expect, vi, beforeEach
} from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Mock axios
vi.mock('../utils/axios', () => ({
    default: {
        get: vi.fn().mockResolvedValue({ data: {} }),
        post: vi.fn().mockResolvedValue({ data: {} }),
        put: vi.fn(),
        delete: vi.fn(),
        defaults: {
            headers: {
                common: {}
            },
            withCredentials: true,
        },
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() }
        }
    }
}));

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should start with no user when not authenticated', async () => {
        const TestComponent = () => {

            const { user, isAuthenticated } = useAuth();
            return (
                <div>
                    <span data-testid="authenticated">{isAuthenticated ? 'yes' : 'no'}</span>
                    <span data-testid="user">{user?.name || 'none'}</span>
                </div>
            );
        };

        render(
            <BrowserRouter>
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
        });
    });

    it('should set user on login (tokens are in httpOnly cookies)', async () => {
        const TestComponent = () => {

            const { login, user, isAuthenticated } = useAuth();

            return (
                <div>
                    <button onClick={() => login({ id: '1', name: 'Test', email: 'test@test.com', role: 'ADMIN', permissions: [] })}>
                        Login
                    </button>
                    <span data-testid="authenticated">{isAuthenticated ? 'yes' : 'no'}</span>
                    <span data-testid="user-name">{user?.name || 'none'}</span>
                </div>
            );
        };

        render(
            <BrowserRouter>
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            </BrowserRouter>
        );

        const loginButton = screen.getByRole('button', { name: /login/i });
        await userEvent.click(loginButton);

        await waitFor(() => {
            expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
            expect(screen.getByTestId('user-name')).toHaveTextContent('Test');
        });
    });

    it('should clear user on logout', async () => {
        const TestComponent = () => {

            const { login, logout, isAuthenticated } = useAuth();

            return (
                <div>
                    <button onClick={() => login({ id: '1', name: 'Test', email: 'test@test.com', role: 'ADMIN', permissions: [] })}>
                        Login
                    </button>
                    <button onClick={logout}>Logout</button>
                    <span data-testid="authenticated">{isAuthenticated ? 'yes' : 'no'}</span>
                </div>
            );
        };

        render(
            <BrowserRouter>
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            </BrowserRouter>
        );

        // Login first
        await userEvent.click(screen.getByRole('button', { name: /login/i }));
        await waitFor(() => {
            expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
        });

        // Then logout
        await userEvent.click(screen.getByRole('button', { name: /logout/i }));

        await waitFor(() => {
            expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
        });
    });
});

describe('Permission Helpers', () => {
    it('should check permissions correctly', async () => {
        const TestComponent = () => {

            const { login, canCreate, canEdit, canDelete } = useAuth();

            React.useEffect(() => {
                login({
                    id: '1',
                    name: 'Test',
                    email: 'test@test.com',
                    role: 'OPERATOR',
                    permissions: ['INCIDENT_CREATE', 'INCIDENT_EDIT']
                });
            }, [login]);

            return (
                <div>
                    <span data-testid="can-create">{canCreate() ? 'yes' : 'no'}</span>
                    <span data-testid="can-edit">{canEdit() ? 'yes' : 'no'}</span>
                    <span data-testid="can-delete">{canDelete() ? 'yes' : 'no'}</span>
                </div>
            );
        };

        render(
            <BrowserRouter>
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId('can-create')).toHaveTextContent('yes');
            expect(screen.getByTestId('can-edit')).toHaveTextContent('yes');
            expect(screen.getByTestId('can-delete')).toHaveTextContent('no');
        });
    });
});
