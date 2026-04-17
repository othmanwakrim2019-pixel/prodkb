/**
 * UserTable Component Tests
 * Verifies rendering, filtering, action callbacks, and conditional action columns.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { UserTable } from '../features/admin/components/UserTable';
import { ToastProvider } from '../components/ui/Toast';
import { ConfirmProvider } from '../components/ui/ConfirmDialog';
import type { User } from '../types';

// Wrap with required context providers
const renderWithProviders = (ui: React.ReactElement) =>
    render(
        <ToastProvider>
            <ConfirmProvider>
                {ui}
            </ConfirmProvider>
        </ToastProvider>
    );

const mockUsers: User[] = [
    {
        id: 'u1',
        name: 'Alice Admin',
        email: 'alice@company.com',
        role: { id: 'r1', name: 'ADMIN' } as User['role'],
        isActive: true,
        teamMemberships: [{ team: { id: 't1', name: 'Platform' }, role: 'Lead' }] as unknown as User['teamMemberships'],
    },
    {
        id: 'u2',
        name: 'Bob Viewer',
        email: 'bob@company.com',
        role: { id: 'r2', name: 'VIEWER' } as User['role'],
        isActive: false,
        teamMemberships: [],
    },
];

describe('UserTable', () => {
    const defaultProps = {
        users: mockUsers,
        searchTerm: '',
        canManageUsers: true,
        onEdit: vi.fn(),
        onDelete: vi.fn(),
    };

    it('renders all users when no search term', () => {
        renderWithProviders(<UserTable {...defaultProps} />);

        expect(screen.getByText('Alice Admin')).toBeInTheDocument();
        expect(screen.getByText('Bob Viewer')).toBeInTheDocument();
        expect(screen.getByText('alice@company.com')).toBeInTheDocument();
        expect(screen.getByText('bob@company.com')).toBeInTheDocument();
    });

    it('filters users by name', () => {
        renderWithProviders(<UserTable {...defaultProps} searchTerm="alice" />);

        expect(screen.getByText('Alice Admin')).toBeInTheDocument();
        expect(screen.queryByText('Bob Viewer')).not.toBeInTheDocument();
    });

    it('filters users by email', () => {
        renderWithProviders(<UserTable {...defaultProps} searchTerm="bob@" />);

        expect(screen.queryByText('Alice Admin')).not.toBeInTheDocument();
        expect(screen.getByText('Bob Viewer')).toBeInTheDocument();
    });

    it('displays active/inactive status badges', () => {
        renderWithProviders(<UserTable {...defaultProps} />);

        expect(screen.getByText(/Active/)).toBeInTheDocument();
        expect(screen.getByText(/Inactive/)).toBeInTheDocument();
    });

    it('displays role badges', () => {
        renderWithProviders(<UserTable {...defaultProps} />);

        expect(screen.getByText('ADMIN')).toBeInTheDocument();
        expect(screen.getByText('VIEWER')).toBeInTheDocument();
    });

    it('displays team memberships', () => {
        renderWithProviders(<UserTable {...defaultProps} />);

        expect(screen.getByText('Platform (Lead)')).toBeInTheDocument();
    });

    it('calls onEdit when edit button is clicked', () => {
        const onEdit = vi.fn();
        renderWithProviders(<UserTable {...defaultProps} onEdit={onEdit} />);

        const editButtons = screen.getAllByTitle('Edit user');
        fireEvent.click(editButtons[0]);

        expect(onEdit).toHaveBeenCalledTimes(1);
        expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'u1', name: 'Alice Admin' }));
    });

    it('calls onDelete when delete button is clicked', () => {
        const onDelete = vi.fn();
        renderWithProviders(<UserTable {...defaultProps} onDelete={onDelete} />);

        const deleteButtons = screen.getAllByTitle('Delete user');
        fireEvent.click(deleteButtons[1]);

        expect(onDelete).toHaveBeenCalledTimes(1);
        expect(onDelete).toHaveBeenCalledWith('u2', 'Bob Viewer');
    });

    it('hides action column when canManageUsers is false', () => {
        renderWithProviders(<UserTable {...defaultProps} canManageUsers={false} />);

        expect(screen.queryByTitle('Edit user')).not.toBeInTheDocument();
        expect(screen.queryByTitle('Delete user')).not.toBeInTheDocument();
    });

    it('shows empty table when no users match search', () => {
        renderWithProviders(<UserTable {...defaultProps} searchTerm="zzz-no-match" />);

        expect(screen.queryByText('Alice Admin')).not.toBeInTheDocument();
        expect(screen.queryByText('Bob Viewer')).not.toBeInTheDocument();
    });
});
