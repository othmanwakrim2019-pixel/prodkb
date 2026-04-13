import { useEffect, useState } from 'react';
import { KeyRound, Pencil, Trash2, Unlock } from 'lucide-react';
import type { TeamMembership, User } from '../../../types';
import { Pagination } from '../../../components/ui/Pagination';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';
import { userService } from '../api/admin.service';

interface Props {
    users: User[];
    searchTerm: string;
    canManageUsers: boolean;
    onEdit: (user: User) => void;
    onDelete: (userId: string, userName: string) => void;
}

interface ResetPasswordTarget {
    id: string;
    name: string;
}

interface ResetPasswordModalProps {
    target: ResetPasswordTarget;
    loading: boolean;
    onCancel: () => void;
    onConfirm: (password: string) => Promise<void>;
}

const ITEMS_PER_PAGE = 10;

const ResetPasswordModal = ({ target, loading, onCancel, onConfirm }: ResetPasswordModalProps) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        const trimmedPassword = password.trim();

        if (trimmedPassword.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        setError(null);
        await onConfirm(trimmedPassword);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
                <h3 className="text-lg font-semibold text-slate-900">Reset Password</h3>
                <p className="mt-2 text-sm text-slate-600">
                    Set a new password for <span className="font-medium text-slate-800">{target.name}</span>.
                </p>

                <div className="mt-4">
                    <label htmlFor="reset-password-input" className="mb-2 block text-sm font-medium text-slate-700">
                        New password
                    </label>
                    <input
                        id="reset-password-input"
                        type="password"
                        autoFocus
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        placeholder="Minimum 8 characters"
                    />
                    {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => void handleSubmit()}
                        disabled={loading}
                        className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const UserTable = ({ users, searchTerm, canManageUsers, onEdit, onDelete }: Props) => {
    const [page, setPage] = useState(1);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [resetTarget, setResetTarget] = useState<ResetPasswordTarget | null>(null);
    const toast = useToast();
    const { confirm } = useConfirm();

    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

    const filteredUsers = users.filter((user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const paginatedUsers = filteredUsers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const handleUnlock = async (email: string, name: string) => {
        const shouldUnlock = await confirm(
            `Unlock account for "${name}"?`,
            `This will clear any login lockout for ${email}.`
        );

        if (!shouldUnlock) {
            return;
        }

        setActionLoading(email);

        try {
            await userService.unlockAccount(email);
            toast.success(`Account "${name}" has been unlocked successfully.`);
        } catch (err) {
            toast.error(`Failed to unlock account: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleResetPassword = async (userId: string, name: string, newPassword: string) => {
        const shouldReset = await confirm(
            `Reset password for "${name}"?`,
            'The user will need to use the new password on their next login.'
        );

        if (!shouldReset) {
            return;
        }

        setActionLoading(userId);

        try {
            await userService.resetPassword(userId, newPassword);
            toast.success(`Password for "${name}" has been reset successfully.`);
            setResetTarget(null);
        } catch (err) {
            toast.error(`Failed to reset password: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Team</th>
                            {canManageUsers && (
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                        {paginatedUsers.map((user) => {
                            const roleName = typeof user.role === 'object' ? user.role.name : user.role;
                            const isActive = user.isActive !== false;

                            return (
                                <tr key={user.id}>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">{user.name}</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">{user.email}</td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <span
                                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                                roleName === 'ADMIN'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : roleName === 'EXPERT'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-slate-100 text-slate-800'
                                            }`}
                                        >
                                            {roleName || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                                                isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}
                                        >
                                            {isActive ? '✓ Active' : '✗ Inactive'}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                                        {user.teamMemberships && user.teamMemberships.length > 0
                                            ? user.teamMemberships
                                                .map((membership: TeamMembership) => `${membership.team.name} (${membership.role})`)
                                                .join(', ')
                                            : '-'}
                                    </td>
                                    {canManageUsers && (
                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => void handleUnlock(user.email, user.name)}
                                                    disabled={actionLoading === user.email}
                                                    className="rounded p-1.5 text-green-600 transition-colors hover:bg-green-50 hover:text-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                                                    title="Unlock account"
                                                >
                                                    <Unlock className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => setResetTarget({ id: user.id, name: user.name })}
                                                    disabled={actionLoading === user.id}
                                                    className="rounded p-1.5 text-amber-600 transition-colors hover:bg-amber-50 hover:text-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
                                                    title="Reset password"
                                                >
                                                    <KeyRound className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => onEdit({ ...user, isActive: user.isActive ?? true })}
                                                    className="rounded p-1.5 text-accent transition-colors hover:bg-blue-50 hover:text-blue-900"
                                                    title="Edit user"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => onDelete(user.id, user.name)}
                                                    className="rounded p-1.5 text-red-600 transition-colors hover:bg-red-50 hover:text-red-900"
                                                    title="Delete user"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
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

            {resetTarget && (
                <ResetPasswordModal
                    target={resetTarget}
                    loading={actionLoading === resetTarget.id}
                    onCancel={() => {
                        if (actionLoading !== resetTarget.id) {
                            setResetTarget(null);
                        }
                    }}
                    onConfirm={(password) => handleResetPassword(resetTarget.id, resetTarget.name, password)}
                />
            )}
        </>
    );
};
