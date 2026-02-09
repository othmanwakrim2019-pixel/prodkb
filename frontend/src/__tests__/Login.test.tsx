import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { Login } from '../pages/Login';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the API calls
const mockLogin = vi.fn().mockResolvedValue({
    data: {
        token: 'fake-token',
        user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'VIEWER', permissions: [] }
    }
});
vi.mock('../utils/axios', () => ({
    default: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        post: (...args: any[]) => mockLogin(...args),
        defaults: {
            headers: { common: {} }
        },
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() }
        }
    }
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('Login Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
    });

    const renderLogin = () => {
        return render(
            <BrowserRouter>
                <AuthProvider>
                    <Login />
                </AuthProvider>
            </BrowserRouter>
        );
    };

    it('renders login form correctly', () => {
        renderLogin();
        expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('displays error when active status check fails', async () => {
        mockLogin.mockRejectedValueOnce({
            response: {
                data: {
                    error: 'Account has been deactivated. Please contact your administrator.'
                }
            }
        });

        renderLogin();

        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'inactive@prodkb.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(screen.getByText(/account has been deactivated/i)).toBeInTheDocument();
        });
    });

    it('redirects to dashboard on successful login', async () => {
        mockLogin.mockResolvedValueOnce({
            data: {
                token: 'fake-token',
                user: { id: '1', name: 'Test User', role: 'ADMIN' }
            }
        });

        renderLogin();

        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'admin@prodkb.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });
});
