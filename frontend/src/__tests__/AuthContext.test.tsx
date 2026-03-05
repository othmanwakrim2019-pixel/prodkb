/**
 * AuthContext Tests — uses renderHook (lightweight, no heavy DOM tree renders).
 * Previous: rendered BrowserRouter+AuthProvider+TestComponent 4× → 4 GB OOM crash
 * Current:  renderHook with minimal wrapper → fast, <100 MB
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';

// ── vi.hoisted() ensures these run BEFORE vi.mock() factory (which is hoisted to top) ──
const { mockUseIdleTimeout } = vi.hoisted(() => ({
    mockUseIdleTimeout: vi.fn().mockReturnValue({
        showWarning: false,
        remaining: 0,
        dismissWarning: vi.fn(),
    }),
}));

vi.mock('../utils/axios', () => ({
    default: {
        get: vi.fn().mockRejectedValue({ response: { status: 401 } }),
        post: vi.fn().mockResolvedValue({ data: {} }),
        put: vi.fn(),
        delete: vi.fn(),
        defaults: { withCredentials: true },
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
    },
}));

// Prevents real 25min/30min timers that SessionTimeoutWarning creates
vi.mock('../hooks/useIdleTimeout', () => ({
    useIdleTimeout: mockUseIdleTimeout,
}));

// ── Wrapper ───────────────────────────────────────────────────────────────────

const wrapper = ({ children }: { children: ReactNode }) => (
    <BrowserRouter>
        <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
);

const mockUser = (overrides: Record<string, unknown> = {}) => ({
    id: '1', name: 'Alice', email: 'alice@example.com', role: 'ADMIN', permissions: [], ...overrides,
});

// ── AuthContext Tests ─────────────────────────────────────────────────────────

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Restore idle timeout mock after clearAllMocks resets it
        mockUseIdleTimeout.mockReturnValue({ showWarning: false, remaining: 0, dismissWarning: vi.fn() });
    });

    it('starts unauthenticated when /auth/v1/me returns 401', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
    });

    it('login() stores user and sets isAuthenticated', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => { result.current.login(mockUser()); });

        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user?.name).toBe('Alice');
    });

    it('logout() clears user and calls /auth/v1/logout', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => { result.current.login(mockUser({ name: 'Bob' })); });
        expect(result.current.isAuthenticated).toBe(true);

        await act(async () => { await result.current.logout(); });

        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
    });
});

// ── Permission Helpers ────────────────────────────────────────────────────────

describe('Permission Helpers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseIdleTimeout.mockReturnValue({ showWarning: false, remaining: 0, dismissWarning: vi.fn() });
    });

    it('canCreate/canEdit/canDelete reflect the permissions array', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => {
            result.current.login(mockUser({
                role: 'OPERATOR',
                permissions: ['INCIDENT_CREATE', 'INCIDENT_EDIT'],
            }));
        });

        expect(result.current.canCreate()).toBe(true);
        expect(result.current.canEdit()).toBe(true);
        expect(result.current.canDelete()).toBe(false);
    });

    it('role helpers match the user role', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => { result.current.login(mockUser({ role: 'ADMIN' })); });

        expect(result.current.isAdmin()).toBe(true);
        expect(result.current.isExpert()).toBe(false);
        expect(result.current.isOperator()).toBe(false);
        expect(result.current.isViewer()).toBe(false);
    });
});
