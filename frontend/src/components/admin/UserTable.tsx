import { Pencil, Trash2 } from 'lucide-react';
import { User, TeamMembership } from '../../types';

interface Props {
    users: User[];
    searchTerm: string;
    canManageUsers: boolean;
    onEdit: (user: User) => void;
    onDelete: (userId: string, userName: string) => void;
}

export const UserTable = ({ users, searchTerm, canManageUsers, onEdit, onDelete }: Props) => {
    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    {filteredUsers.map((u) => (
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
                                    <button
                                        onClick={() => onEdit({ ...u, isActive: u.isActive ?? true })}
                                        className="text-accent hover:text-blue-900 mr-3"
                                        title="Edit user"
                                    >
                                        <Pencil className="h-4 w-4 inline" />
                                    </button>
                                    <button
                                        onClick={() => onDelete(u.id, u.name)}
                                        className="text-red-600 hover:text-red-900"
                                        title="Delete user"
                                    >
                                        <Trash2 className="h-4 w-4 inline" />
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
