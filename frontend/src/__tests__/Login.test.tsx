import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { Login } from '../pages/Login';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock i18next so translation keys return readable text
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                'login.title': 'Sign In',
                'login.subtitle': 'Sign in to your account',
                'login.emailLabel': 'Email Address',
                'login.emailPlaceholder': 'Enter your email',
                'login.passwordLabel': 'Password',
                'login.passwordPlaceholder': 'Enter your password',
                'login.signIn': 'Sign In',
                'login.signingIn': 'Signing in...',
                'login.error': 'Login failed',
            };
            return translations[key] || key;
        },
        i18n: { language: 'en', changeLanguage: vi.fn() },
    }),
    Trans: ({ children }: { children: React.ReactNode }) => children,
    initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

// Mock the API calls
const mockLogin = vi.fn().mockResolvedValue({
    data: {
        user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'VIEWER', permissions: [] }
    }
});
// Rejects by default (simulates no active session on page load — used by AuthContext init)
const mockGet = vi.fn().mockRejectedValue(new Error('No session'));


vi.mock('../utils/axios', () => ({
    default: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        post: (...args: any[]) => mockLogin(...args),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        get: (...args: any[]) => mockGet(...args),
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
        expect(screen.getByText('Sign In')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('displays error when active status check fails', async () => {
        mockLogin.mockRejectedValueOnce({
            response: {
                data: {
                    message: 'Account has been deactivated. Please contact your administrator.'
                }
            }
        });

        renderLogin();

        fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'inactive@prodkb.com' } });
        fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(screen.getByText(/account has been deactivated/i)).toBeInTheDocument();
        });
    });

    it('redirects to dashboard on successful login', async () => {
        mockLogin.mockResolvedValueOnce({
            data: {
                user: { id: '1', name: 'Test User', role: 'ADMIN' }
            }
        });

        renderLogin();

        // Wait for the initial mount's initAuth() to call getMe() and consume the default rejection
        await waitFor(() => {
            expect(mockGet).toHaveBeenCalledTimes(1);
        });

        // Now queue the resolve for the second getMe() call which happens inside AuthContext.login()
        mockGet.mockResolvedValueOnce({
            data: { data: { id: '1', name: 'Test User', email: 'admin@prodkb.com', role: 'ADMIN', permissions: [] } }
        });

        fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'admin@prodkb.com' } });
        fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });
});

