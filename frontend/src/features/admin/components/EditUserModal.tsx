import React, { useState } from 'react';
import { User, TeamMembership } from '../../../types';
import { useConfirm } from '../../../components/ui/ConfirmDialog';

interface Team {
    id: string;
    name: string;
}

interface Role {
    id: string;
    name: string;
}

interface Props {
    user: User;
    teams: Team[];
    roles: Role[];
    onClose: () => void;
    onSave: (user: User) => void;
    onAddTeam: (teamId: string, role: string) => Promise<void>;
    onRemoveTeam: (teamId: string) => Promise<void>;
}

export const EditUserModal = ({ user, teams, roles, onClose, onSave, onAddTeam, onRemoveTeam }: Props) => {
    const [editingUser, setEditingUser] = useState<User>({ ...user });
    const [assignTeam, setAssignTeam] = useState({ teamId: '', role: '' });
    const { confirm } = useConfirm();

    const handleAddTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignTeam.teamId) return;
        await onAddTeam(assignTeam.teamId, assignTeam.role || 'MEMBER');

        // Update local state
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
        setAssignTeam({ teamId: '', role: '' });
    };

    const handleRemoveTeam = async (teamId: string) => {
        if (!await confirm('Remove from team?', 'This user will be removed from this team.', 'danger')) return;
        await onRemoveTeam(teamId);
        setEditingUser({
            ...editingUser,
            teamMemberships: editingUser.teamMemberships?.filter(tm => tm.team.id !== teamId)
        });
    };

    return (
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
                                <option key={role.id} value={role.name}>{role.name}</option>
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
                                            onClick={() => handleRemoveTeam(tm.team.id)}
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
                                onClick={handleAddTeam}
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
                        onClick={onClose}
                        className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(editingUser)}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
