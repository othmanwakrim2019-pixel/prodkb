import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import { Plus, Search as SearchIcon, Pencil, Trash2 } from 'lucide-react';
import { User, TeamMembership } from '../../types';

interface Team {
    id: string;
    name: string;
}

interface Role {
    id: string;
    name: string;
}

export const UserManagement = () => {
    const { canManageUsers } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [showUserForm, setShowUserForm] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: '', teamId: '', teamRole: '', isActive: true });
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [assignTeam, setAssignTeam] = useState({ teamId: '', role: '' });

    useEffect(() => {
        fetchUsers();
        fetchTeams();
        fetchRoles();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    const fetchTeams = async () => {
        try {
            const response = await axios.get('/api/teams');
            setTeams(response.data);
        } catch (error) {
            console.error('Failed to fetch teams', error);
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await axios.get('/api/roles');
            setRoles(response.data);
        } catch (error) {
            console.error('Failed to fetch roles', error);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('/auth/register', newUser);
            setNewUser({ name: '', email: '', password: '', role: '', teamId: '', teamRole: '', isActive: true });
            setShowUserForm(false);
            await fetchUsers();
            alert('User created successfully!');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.error || 'Failed to create user');
        }
    };

    const handleUpdateUser = async () => {
        if (!editingUser) return;
        try {
            await axios.put(`/api/users/${editingUser.id}`, {
                name: editingUser.name,
                email: editingUser.email,
                role: typeof editingUser.role === 'object' ? editingUser.role.name : editingUser.role,
                isActive: editingUser.isActive
            });
            setEditingUser(null);
            await fetchUsers();
            alert('User updated successfully!');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.error || 'Failed to update user');
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!confirm(`Delete user "${userName}"? This cannot be undone.`)) return;
        try {
            await axios.delete(`/api/users/${userId}`);
            await fetchUsers();
            alert('User deleted successfully!');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.error || 'Failed to delete user');
        }
    };

    const handleAddTeamToUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser || !assignTeam.teamId) return;

        try {
            await axios.post(`/api/teams/${assignTeam.teamId}/members`, {
                userId: editingUser.id,
                role: assignTeam.role || 'MEMBER'
            });

            setAssignTeam({ teamId: '', role: '' });
            await fetchUsers(); // Refresh to get updated memberships

            // Actually, to make the UI update immediately in the modal, we need to update editingUser.
            // We can ask the backend for the updated user or manually construct it.
            // Manual update:
            const team = teams.find(t => t.id === assignTeam.teamId);
            if (team) {
                const newMembership = {
                    role: assignTeam.role || 'MEMBER',
                    team: { id: team.id, name: team.name }
                };
                setEditingUser({
                    ...editingUser,
                    teamMemberships: [...(editingUser.teamMemberships || []), newMembership as unknown as TeamMembership]
                });
            }

            alert('Team assigned successfully!');
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.error || 'Failed to assign team');
        }
    };

    const handleRemoveTeamFromUser = async (teamId: string) => {
        if (!editingUser || !confirm('Remove user from this team?')) return;
        try {
            await axios.delete(`/api/teams/${teamId}/members/${editingUser.id}`);

            // Update local state
            setEditingUser({
                ...editingUser,
                teamMemberships: editingUser.teamMemberships?.filter(tm => tm.team.id !== teamId)
            });

            await fetchUsers();
            alert('Team removed successfully!');
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.error || 'Failed to remove team');
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-900">User Management</h2>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:border-accent focus:ring-accent sm:text-sm"
                        />
                    </div>
                    {canManageUsers() && (
                        <button
                            onClick={() => setShowUserForm(!showUserForm)}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create User
                        </button>
                    )}
                </div>
            </div>

            {showUserForm && (
                <form onSubmit={handleCreateUser} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-4">
                    <h3 className="font-medium text-slate-900">Create New User</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                            <input
                                type="text"
                                required
                                value={newUser.name}
                                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <input
                                type="password"
                                required
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                            <select
                                required
                                value={newUser.role}
                                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                            >
                                <option value="">Select a role...</option>
                                {roles.map((role) => (
                                    <option key={role.id} value={role.name}>
                                        {role.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Team *</label>
                            <select
                                required
                                value={newUser.teamId}
                                onChange={(e) => setNewUser({ ...newUser, teamId: e.target.value })}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                            >
                                <option value="">Select a team...</option>
                                {teams.map((team) => (
                                    <option key={team.id} value={team.id}>
                                        {team.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Team Role</label>
                            <input
                                type="text"
                                placeholder="e.g., Developer, Lead, CTO..."
                                value={newUser.teamRole}
                                onChange={(e) => setNewUser({ ...newUser, teamRole: e.target.value })}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                            <select
                                value={newUser.isActive ? 'active' : 'inactive'}
                                onChange={(e) => setNewUser({ ...newUser, isActive: e.target.value === 'active' })}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setShowUserForm(false)}
                            className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800"
                        >
                            Create User
                        </button>
                    </div>
                </form>
            )}

            <div className="bg-white shadow-sm rounded-lg border border-slate-200 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Team</th>
                            {canManageUsers() && <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>}
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
                                {canManageUsers() && (
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => setEditingUser({ ...u, isActive: u.isActive ?? true })}
                                            className="text-accent hover:text-blue-900 mr-3"
                                            title="Edit user"
                                        >
                                            <Pencil className="h-4 w-4 inline" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(u.id, u.name)}
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

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full m-4">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Edit User</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={editingUser.name}
                                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={editingUser.email}
                                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                <select
                                    value={typeof editingUser.role === 'string' ? editingUser.role : editingUser.role?.name || ''}
                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                >
                                    <option value="">Select a role...</option>
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.name}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select
                                    value={editingUser.isActive ? 'active' : 'inactive'}
                                    onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.value === 'active' })}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        {/* Team Management Section */}
                        <div className="mb-6">
                            <h4 className="text-md font-medium text-slate-900 mb-3 border-b pb-1">Team Memberships</h4>

                            <div className="bg-slate-50 rounded-md p-4 mb-4">
                                <div className="space-y-2 mb-4">
                                    {editingUser.teamMemberships && editingUser.teamMemberships.length > 0 ? (
                                        editingUser.teamMemberships.map((tm, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                                                <span className="text-sm">
                                                    <span className="font-medium">{tm.team.name}</span>
                                                    <span className="text-slate-500 mx-2">•</span>
                                                    <span className="text-slate-600">{tm.role}</span>
                                                </span>
                                                <button
                                                    onClick={() => handleRemoveTeamFromUser(tm.team.id)}
                                                    className="text-red-500 hover:text-red-700 text-xs px-2 py-1"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-500 italic">No team memberships.</p>
                                    )}
                                </div>

                                <h5 className="text-sm font-medium text-slate-700 mb-2">Add to Team</h5>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <select
                                            value={assignTeam.teamId}
                                            onChange={(e) => setAssignTeam({ ...assignTeam, teamId: e.target.value })}
                                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                        >
                                            <option value="">Select Team...</option>
                                            {teams.filter(t => !editingUser.teamMemberships?.some(tm => tm.team.id === t.id)).map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-1/3">
                                        <input
                                            type="text"
                                            placeholder="Role"
                                            value={assignTeam.role}
                                            onChange={(e) => setAssignTeam({ ...assignTeam, role: e.target.value })}
                                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddTeamToUser}
                                        disabled={!assignTeam.teamId}
                                        className="px-3 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 text-sm font-medium disabled:opacity-50"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 border-t pt-4">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateUser}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
