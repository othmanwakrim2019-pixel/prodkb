import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PermissionRoute } from '../components/PermissionRoute';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock AuthContext
const mockHasPermission = vi.fn();
const mockIsLoading = vi.fn().mockReturnValue(false);

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        hasPermission: mockHasPermission,
        isLoading: mockIsLoading(),
        user: { id: '1', name: 'Test', role: 'VIEWER' },
    }),
}));

describe('PermissionRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockIsLoading.mockReturnValue(false);
    });

    const renderWithRouter = (permission: string) => {
        return render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route path="/" element={<div>Home (redirected)</div>} />
                    <Route element={<PermissionRoute permission={permission} />}>
                        <Route path="/protected" element={<div>Protected Content</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );
    };

    it('renders protected content when user has permission', () => {
        mockHasPermission.mockReturnValue(true);
        renderWithRouter('DASHBOARD_VIEW');

        expect(screen.getByText('Protected Content')).toBeInTheDocument();
        expect(mockHasPermission).toHaveBeenCalledWith('DASHBOARD_VIEW');
    });

    it('redirects to home when user lacks permission', () => {
        mockHasPermission.mockReturnValue(false);
        renderWithRouter('ADMIN_ONLY');

        expect(screen.getByText('Home (redirected)')).toBeInTheDocument();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('shows loading state while auth is loading', () => {
        mockIsLoading.mockReturnValue(true);
        mockHasPermission.mockReturnValue(false);
        renderWithRouter('DASHBOARD_VIEW');

        expect(screen.getByText('Loading...')).toBeInTheDocument();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
});
