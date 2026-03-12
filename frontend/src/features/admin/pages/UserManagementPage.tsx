import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Plus, Search as SearchIcon } from 'lucide-react';
import { User } from '../../../types';
import { useTranslation } from 'react-i18next';
import { UserTable } from '../components/UserTable';
import { EditUserModal } from '../components/EditUserModal';
import { userService, teamService, roleService } from '../api/admin.service';
import { useToast } from '../../../components/ui/Toast';
import { useConfirm } from '../../../components/ui/ConfirmDialog';

interface Team {
    id: string;
    name: string;
}

interface Role {
    id: string;
    name: string;
}

export const UserManagementPage = () => {
    const { canManageUsers } = useAuth();
    const { t } = useTranslation();
    const toast = useToast();
    const { confirm } = useConfirm();
    const [users, setUsers] = useState<User[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [showUserForm, setShowUserForm] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: '', teamId: '', teamRole: '', isActive: true });
    const [editingUser, setEditingUser] = useState<User | null>(null);

    useEffect(() => {
        fetchUsers();
        fetchTeams();
        fetchRoles();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await userService.getAll();
            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    const fetchTeams = async () => {
        try {
            const data = await teamService.getAll();
            setTeams(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch teams', error);
        }
    };

    const fetchRoles = async () => {
        try {
            const data = await roleService.getAll();
            setRoles(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch roles', error);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await userService.create(newUser);
            setNewUser({ name: '', email: '', password: '', role: '', teamId: '', teamRole: '', isActive: true });
            setShowUserForm(false);
            await fetchUsers();
            toast.success('User created successfully!');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to create user');
        }
    };

    const handleSaveUser = async (user: User) => {
        try {
            await userService.update(user.id, {
                name: user.name,
                email: user.email,
                role: typeof user.role === 'object' ? user.role.name : user.role,
                isActive: user.isActive
            });
            setEditingUser(null);
            await fetchUsers();
            toast.success('User updated successfully!');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to update user');
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!await confirm(`Delete user "${userName}"?`, 'This action cannot be undone.', 'danger')) return;
        try {
            await userService.delete(userId);
            await fetchUsers();
            toast.success('User deleted successfully!');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to delete user');
        }
    };

    const handleAddTeamToUser = async (teamId: string, role: string) => {
        if (!editingUser) return;
        try {
            await userService.addToTeam(teamId, editingUser.id, role);
            await fetchUsers();
            toast.success('Team assigned successfully!');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to assign team');
        }
    };

    const handleRemoveTeamFromUser = async (teamId: string) => {
        if (!editingUser) return;
        try {
            await userService.removeFromTeam(teamId, editingUser.id);
            await fetchUsers();
            toast.success('Team removed successfully!');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to remove team');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-900">{t('admin.users.title')}</h2>
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

            {/* Create User Form (inline) */}
            {showUserForm && (
                <form onSubmit={handleCreateUser} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-4">
                    <h3 className="font-medium text-slate-900">Create New User</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                            <input type="text" required value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input type="email" required value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <input type="password" required value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                            <select required value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border">
                                <option value="">Select a role...</option>
                                {roles.map((role) => (<option key={role.id} value={role.name}>{role.name}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Team *</label>
                            <select required value={newUser.teamId} onChange={(e) => setNewUser({ ...newUser, teamId: e.target.value })} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border">
                                <option value="">Select a team...</option>
                                {teams.map((team) => (<option key={team.id} value={team.id}>{team.name}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Team Role</label>
                            <input type="text" placeholder="e.g., Developer, Lead, CTO..." value={newUser.teamRole} onChange={(e) => setNewUser({ ...newUser, teamRole: e.target.value })} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                            <select value={newUser.isActive ? 'active' : 'inactive'} onChange={(e) => setNewUser({ ...newUser, isActive: e.target.value === 'active' })} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border">
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowUserForm(false)} className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                        <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800">Create User</button>
                    </div>
                </form>
            )}

            {/* User Table — extracted component */}
            <UserTable
                users={users}
                searchTerm={userSearch}
                canManageUsers={canManageUsers()}
                onEdit={setEditingUser}
                onDelete={handleDeleteUser}
            />

            {/* Edit User Modal — extracted component */}
            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    teams={teams}
                    roles={roles}
                    onClose={() => setEditingUser(null)}
                    onSave={handleSaveUser}
                    onAddTeam={handleAddTeamToUser}
                    onRemoveTeam={handleRemoveTeamFromUser}
                />
            )}
        </div>
    );
};

export default UserManagementPage;
