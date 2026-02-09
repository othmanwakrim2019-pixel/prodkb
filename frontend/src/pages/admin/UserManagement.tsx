import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import { Plus, Search as SearchIcon, Pencil, Trash2 } from 'lucide-react';
import { User } from '../../types';

export const UserManagement = () => {
    const { canManageUsers } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [showUserForm, setShowUserForm] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'OPERATOR', team: '' });
    const [editingUser, setEditingUser] = useState<User | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('/auth/register', newUser);
            setNewUser({ name: '', email: '', password: '', role: 'OPERATOR', team: '' });
            setShowUserForm(false);
            await fetchUsers();
            alert('User created successfully!');
            await fetchUsers();
            alert('User created successfully!');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error(error);
        }
    };

    const handleUpdateUser = async () => {
        if (!editingUser) return;
        try {
            await axios.put(`/api/users/${editingUser.id}`, {
                name: editingUser.name,
                email: editingUser.email,
                role: editingUser.role,
                isActive: editingUser.isActive
            });
            setEditingUser(null);
            await fetchUsers();
            alert('User updated successfully!');
            await fetchUsers();
            alert('User updated successfully!');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error(error);
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!confirm(`Delete user "${userName}"? This cannot be undone.`)) return;
        try {
            await axios.delete(`/api/users/${userId}`);
            await fetchUsers();
            alert('User deleted successfully!');
            await fetchUsers();
            alert('User deleted successfully!');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error(error);
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
                                value={newUser.role}
                                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                            >
                                <option value="OPERATOR">Operator</option>
                                <option value="EXPERT">Expert</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Team</label>
                            <input
                                type="text"
                                value={newUser.team}
                                onChange={(e) => setNewUser({ ...newUser, team: e.target.value })}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                            />
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
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{u.team || '-'}</td>
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
                                    value={typeof editingUser.role === 'string' ? editingUser.role : editingUser.role?.name || 'OPERATOR'}
                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                >
                                    <option value="OPERATOR">Operator</option>
                                    <option value="EXPERT">Expert</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="VIEWER">Viewer</option>
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
                        <div className="flex justify-end gap-2">
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
