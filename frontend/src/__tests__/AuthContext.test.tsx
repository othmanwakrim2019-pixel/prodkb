import {
    describe, it, expect, vi, beforeEach
} from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';

// Mock axios
vi.mock('../utils/axios', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        defaults: {
            headers: {
                common: {}
            }
        },
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() }
        }
    }
}));

describe('AuthContext', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('should start with no user when not authenticated', async () => {
        const TestComponent = () => {
            const { useAuth } = require('../context/AuthContext');
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

    it('should store token in localStorage on login', async () => {
        const TestComponent = () => {
            const { useAuth } = require('../context/AuthContext');
            const { login, token } = useAuth();

            return (
                <div>
                    <button onClick={() => login('test-token', { id: '1', name: 'Test', email: 'test@test.com', role: 'ADMIN', permissions: [] })}>
                        Login
                    </button>
                    <span data-testid="token">{token || 'none'}</span>
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
            expect(localStorage.getItem('token')).toBe('test-token');
        });
    });

    it('should clear token on logout', async () => {
        localStorage.setItem('token', 'existing-token');

        const TestComponent = () => {
            const { useAuth } = require('../context/AuthContext');
            const { logout, token } = useAuth();

            return (
                <div>
                    <button onClick={logout}>Logout</button>
                    <span data-testid="token">{token || 'none'}</span>
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

        const logoutButton = screen.getByRole('button', { name: /logout/i });
        await userEvent.click(logoutButton);

        await waitFor(() => {
            expect(localStorage.getItem('token')).toBeNull();
        });
    });
});

describe('Permission Helpers', () => {
    it('should check permissions correctly', async () => {
        const TestComponent = () => {
            const { useAuth } = require('../context/AuthContext');
            const { login, canCreate, canEdit, canDelete } = useAuth();

            React.useEffect(() => {
                login('test-token', {
                    id: '1',
                    name: 'Test',
                    email: 'test@test.com',
                    role: 'OPERATOR',
                    permissions: ['INCIDENT_CREATE', 'INCIDENT_EDIT']
                });
            }, []);

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
