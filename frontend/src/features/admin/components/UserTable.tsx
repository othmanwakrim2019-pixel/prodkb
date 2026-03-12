import { useState, useEffect } from 'react';
import { Pencil, Trash2, Unlock, KeyRound } from 'lucide-react';
import { User, TeamMembership } from '../../../types';
import { Pagination } from '../../../components/ui/Pagination';
import { userService } from '../api/admin.service';
import { useToast } from '../../../components/ui/Toast';
import { useConfirm } from '../../../components/ui/ConfirmDialog';

interface Props {
    users: User[];
    searchTerm: string;
    canManageUsers: boolean;
    onEdit: (user: User) => void;
    onDelete: (userId: string, userName: string) => void;
}

const ITEMS_PER_PAGE = 10;

export const UserTable = ({ users, searchTerm, canManageUsers, onEdit, onDelete }: Props) => {
    const [page, setPage] = useState(1);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const toast = useToast();
    const { confirm } = useConfirm();

    // Reset to page 1 when search changes
    useEffect(() => { setPage(1); }, [searchTerm]);

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const paginatedUsers = filteredUsers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const handleUnlock = async (email: string, name: string) => {
        if (!await confirm(`Unlock account for "${name}"?`, `This will clear any login lockout for ${email}.`)) return;
        setActionLoading(email);
        try {
            await userService.unlockAccount(email);
            toast.success(`Account "${name}" has been unlocked successfully!`);
        } catch (err) {
            toast.error(`Failed to unlock account: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleResetPassword = async (userId: string, name: string) => {
        const newPassword = prompt(`Enter new password for "${name}" (minimum 8 characters):`);
        if (!newPassword) return;
        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters.');
            return;
        }
        if (!await confirm(`Reset password for "${name}"?`, 'The user will need to use the new password on their next login.')) return;
        setActionLoading(userId);
        try {
            await userService.resetPassword(userId, newPassword);
            toast.success(`Password for "${name}" has been reset successfully!`);
        } catch (err) {
            toast.error(`Failed to reset password: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="bg-white shadow-sm rounded-lg border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Team</th>
                        {canManageUsers && <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {paginatedUsers.map((u) => (
                        <tr key={u.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{u.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{u.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${(typeof u.role === 'object' ? u.role.name : u.role) === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                                    (typeof u.role === 'object' ? u.role.name : u.role) === 'EXPERT' ? 'bg-blue-100 text-blue-800' :
                                        'bg-slate-100 text-slate-800'
                                    }`}>
                                    {typeof u.role === 'object' ? u.role.name : (u.role || 'N/A')}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${u.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                    {u.isActive !== false ? '✓ Active' : '✗ Inactive'}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                {u.teamMemberships && u.teamMemberships.length > 0
                                    ? u.teamMemberships.map((tm: TeamMembership) => `${tm.team.name} (${tm.role})`).join(', ')
                                    : '-'}
                            </td>
                            {canManageUsers && (
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => handleUnlock(u.email, u.name)}
                                            disabled={actionLoading === u.email}
                                            className="text-green-600 hover:text-green-800 p-1.5 rounded hover:bg-green-50 transition-colors"
                                            title="Unlock account"
                                        >
                                            <Unlock className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleResetPassword(u.id, u.name)}
                                            disabled={actionLoading === u.id}
                                            className="text-amber-600 hover:text-amber-800 p-1.5 rounded hover:bg-amber-50 transition-colors"
                                            title="Reset password"
                                        >
                                            <KeyRound className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => onEdit({ ...u, isActive: u.isActive ?? true })}
                                            className="text-accent hover:text-blue-900 p-1.5 rounded hover:bg-blue-50 transition-colors"
                                            title="Edit user"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => onDelete(u.id, u.name)}
                                            className="text-red-600 hover:text-red-900 p-1.5 rounded hover:bg-red-50 transition-colors"
                                            title="Delete user"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            {filteredUsers.length > ITEMS_PER_PAGE && (
                <Pagination
                    meta={{
                        total: filteredUsers.length,
                        page,
                        limit: ITEMS_PER_PAGE,
                        totalPages,
                    }}
                    onPageChange={setPage}
                />
            )}
        </div>
    );
};
