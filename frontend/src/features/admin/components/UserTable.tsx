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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-lg animate-scale-in">
                <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Reset Password</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Set a new password for <span className="font-medium text-slate-700 dark:text-slate-200">{target.name}</span>.
                    </p>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label htmlFor="reset-password-input" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">New password</label>
                        <input
                            id="reset-password-input"
                            type="password"
                            autoFocus
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="ent-input"
                            placeholder="Minimum 8 characters"
                        />
                        {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={onCancel} disabled={loading} className="ent-btn-secondary">Cancel</button>
                        <button onClick={() => void handleSubmit()} disabled={loading} className="ent-btn-primary">                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </div>
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
            <div className="ent-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Name</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Role</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Team</th>
                                {canManageUsers && (
                                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                            {paginatedUsers.map((user) => {
                                const roleName = typeof user.role === 'object' ? user.role.name : user.role;
                                const isActive = user.isActive !== false;

                                return (
                                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-none">
                                        <td className="whitespace-nowrap px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-200">{user.name}</td>
                                        <td className="whitespace-nowrap px-4 py-2 text-sm text-slate-500 dark:text-slate-400">{user.email}</td>
                                        <td className="whitespace-nowrap px-4 py-2">
                                            <span
                                                className={`inline-flex rounded px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                                                    roleName === 'ADMIN'
                                                        ? 'bg-purple-600 text-white dark:bg-purple-900/40 dark:text-purple-400'
                                                        : roleName === 'EXPERT'
                                                            ? 'bg-blue-600 text-white dark:bg-blue-900/40 dark:text-blue-400'
                                                            : 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                                                }`}
                                            >
                                                {roleName || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2">
                                            <span
                                                className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                                                    isActive ? 'bg-emerald-600 text-white dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-red-700 text-white dark:bg-red-900/40 dark:text-red-400'
                                                }`}
                                            >
                                                {isActive ? '✓ Active' : '✗ Inactive'}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2 text-sm text-slate-500 dark:text-slate-400">
                                            {user.teamMemberships && user.teamMemberships.length > 0
                                                ? user.teamMemberships
                                                    .map((membership: TeamMembership) => `${membership.team.name} (${membership.role})`)
                                                    .join(', ')
                                                : '-'}
                                        </td>
                                    {canManageUsers && (
                                        <td className="whitespace-nowrap px-4 py-2 text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => void handleUnlock(user.email, user.name)}
                                                    disabled={actionLoading === user.email}
                                                    className="rounded p-1.5 text-slate-400 hover:text-green-600 dark:hover:text-emerald-400 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                                                    title="Unlock account"
                                                >
                                                    <Unlock className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => setResetTarget({ id: user.id, name: user.name })}
                                                    disabled={actionLoading === user.id}
                                                    className="rounded p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                                                    title="Reset password"
                                                >
                                                    <KeyRound className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => onEdit({ ...user, isActive: user.isActive ?? true })}
                                                    className="rounded p-1.5 text-slate-400 hover:text-primary dark:hover:text-indigo-400 transition-colors"
                                                    title="Edit user"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => onDelete(user.id, user.name)}
                                                    className="rounded p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
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
                </div>

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
