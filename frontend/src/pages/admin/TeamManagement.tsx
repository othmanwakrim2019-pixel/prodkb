import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, UserPlus } from 'lucide-react';
import { EditTeamModal } from '../../components/EditTeamModal';
import { Team, User, TeamMember } from '../../types';
import { useTranslation } from 'react-i18next';
import { teamService, userService } from '../../services/admin.service';
import { Pagination } from '../../components/ui/Pagination';

export const TeamManagement = () => {
    const { canManageTeams } = useAuth();
    const { t } = useTranslation();
    const [teams, setTeams] = useState<Team[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
    const [showTeamForm, setShowTeamForm] = useState(false);
    const [showMemberForm, setShowMemberForm] = useState<string | null>(null);
    const [newTeam, setNewTeam] = useState({ name: '', description: '', emailDistribution: '', sendEmail: true });
    const [newMember, setNewMember] = useState({ userId: '', role: '' });
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        fetchTeams();
        fetchUsers();
    }, []);

    const fetchTeams = async () => {
        try {
            const data = await teamService.getAll();
            setTeams(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch teams', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const data = await userService.getAll();
            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await teamService.create(newTeam);
            setNewTeam({ name: '', description: '', emailDistribution: '', sendEmail: true });
            setShowTeamForm(false);
            await fetchTeams();
            alert('Team created successfully!');
            await fetchTeams();
            alert('Team created successfully!');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error(error);
        }
    };

    const handleUpdateTeam = async (updatedTeam: Team) => {
        if (!updatedTeam) return;
        try {
            await teamService.update(updatedTeam.id, {
                name: updatedTeam.name,
                description: updatedTeam.description,
                emailDistribution: updatedTeam.emailDistribution,
                sendEmail: updatedTeam.sendEmail
            });
            setEditingTeam(null);
            await fetchTeams();
            alert('Team updated successfully!');
            await fetchTeams();
            alert('Team updated successfully!');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error(error);
        }
    };

    const handleDeleteTeam = async (teamId: string, teamName: string) => {
        if (!confirm(`Delete team "${teamName}"? This cannot be undone.`)) return;
        try {
            await teamService.delete(teamId);
            await fetchTeams();
            alert('Team deleted successfully!');
            await fetchTeams();
            alert('Team deleted successfully!');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error(error);
        }
    };

    const handleAddTeamMember = async (e: React.FormEvent, teamId: string) => {
        e.preventDefault();
        try {
            if (!newMember.userId) {
                alert('Please select a user');
                return;
            }

            await teamService.addMember(teamId, newMember.userId, newMember.role || 'MEMBER');

            setNewMember({ userId: '', role: '' });
            setShowMemberForm(null);
            await fetchTeams();
            alert('Member added successfully!');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to add member');
        }
    };

    const handleRemoveTeamMember = async (teamId: string, userId: string) => {
        if (!confirm('Are you sure you want to remove this team member?')) return;
        try {
            await teamService.removeMember(teamId, userId);
            await fetchTeams();
            alert('Team member removed successfully!');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to remove member');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-900">{t('admin.teams.title')}</h2>
                {canManageTeams() && (
                    <button
                        onClick={() => setShowTeamForm(!showTeamForm)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Team
                    </button>
                )}
            </div>

            {showTeamForm && (
                <form onSubmit={handleCreateTeam} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-4">
                    <h3 className="font-medium text-slate-900">Create New Team</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Team Name</label>
                            <input
                                type="text"
                                required
                                value={newTeam.name}
                                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email Distribution</label>
                            <input
                                type="email"
                                // required currently optional in backend logic seen before but better to be strict? Backend validation handles it.
                                value={newTeam.emailDistribution}
                                onChange={(e) => setNewTeam({ ...newTeam, emailDistribution: e.target.value })}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                placeholder="team@company.com"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea
                                value={newTeam.description}
                                onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                rows={3}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newTeam.sendEmail}
                                    onChange={(e) => setNewTeam({ ...newTeam, sendEmail: e.target.checked })}
                                    className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                                />
                                <span className="text-sm font-medium text-slate-700">Enable email notifications on incident creation</span>
                            </label>
                            <p className="text-xs text-slate-500 mt-1 ml-7">When enabled, the team will receive email notifications when incidents are assigned to them.</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setShowTeamForm(false)}
                            className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800"
                        >
                            Create Team
                        </button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 gap-4">
                {teams.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE).map((team) => (
                    <div key={team.id} className="bg-white shadow-sm rounded-lg border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-4 cursor-pointer" onClick={() => setExpandedTeamId(expandedTeamId === team.id ? null : team.id)}>
                                {expandedTeamId === team.id ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
                                <div>
                                    <h3 className="text-lg font-medium text-slate-900">{team.name}</h3>
                                    <div className="text-sm text-slate-500 flex gap-4">
                                        <span>{team.emailDistribution}</span>
                                        <span>•</span>
                                        <span>{team.members?.length || 0} members</span>
                                        <span>•</span>
                                        <span>{(team as Team & { systemCount?: number }).systemCount || 0} systems</span>
                                        {!(team as Team & { sendEmail?: boolean }).sendEmail && (
                                            <>
                                                <span>•</span>
                                                <span className="text-amber-600 text-xs">📧 Notifications off</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {canManageTeams() && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setEditingTeam(team)}
                                        className="text-slate-400 hover:text-accent"
                                        title="Edit team"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTeam(team.id, team.name)}
                                        className="text-slate-400 hover:text-red-600"
                                        title="Delete team"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {expandedTeamId === team.id && (
                            <div className="px-6 py-4 border-t border-slate-200">
                                <div className="mb-6">
                                    <h4 className="font-medium text-slate-900 mb-2">Description</h4>
                                    <p className="text-sm text-slate-600">{team.description || 'No description provided.'}</p>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-medium text-slate-900">Team Members</h4>
                                        {canManageTeams() && (
                                            <button
                                                onClick={() => setShowMemberForm(team.id)}
                                                className="text-sm text-accent hover:text-blue-800 font-medium flex items-center"
                                            >
                                                <UserPlus className="h-4 w-4 mr-1" />
                                                Add Member
                                            </button>
                                        )}
                                    </div>

                                    {showMemberForm === team.id && (
                                        <form onSubmit={(e) => handleAddTeamMember(e, team.id)} className="bg-slate-50 p-4 rounded-md mb-4 border border-slate-200">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-700 mb-1">User</label>
                                                    <select
                                                        required
                                                        value={newMember.userId}
                                                        onChange={(e) => setNewMember({ ...newMember, userId: e.target.value })}
                                                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent text-sm p-1 border"
                                                    >
                                                        <option value="">Select User</option>
                                                        {users.map(u => (
                                                            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-700 mb-1">Role</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g., Developer, Lead"
                                                        value={newMember.role}
                                                        onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                                                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent text-sm p-1 border"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowMemberForm(null)}
                                                    className="px-3 py-1 border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-white"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="px-3 py-1 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-primary hover:bg-slate-800"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    {team.members && team.members.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {team.members.map((member: TeamMember) => (
                                                <div key={member.user.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-100">
                                                    <div>
                                                        <p className="font-medium text-sm text-slate-900">{member.user.name}</p>
                                                        <p className="text-xs text-slate-500">{member.role || 'Member'}</p>
                                                    </div>
                                                    {canManageTeams() && (
                                                        <button
                                                            onClick={() => handleRemoveTeamMember(team.id, member.user.id)}
                                                            className="text-slate-400 hover:text-red-600"
                                                            title="Remove member"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500 italic">No members assigned to this team.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {teams.length > ITEMS_PER_PAGE && (
                <Pagination
                    meta={{
                        total: teams.length,
                        page,
                        limit: ITEMS_PER_PAGE,
                        totalPages: Math.ceil(teams.length / ITEMS_PER_PAGE),
                    }}
                    onPageChange={setPage}
                />
            )}

            {editingTeam && (
                <EditTeamModal
                    team={editingTeam}
                    onClose={() => setEditingTeam(null)}
                    onSave={handleUpdateTeam}
                />
            )}
        </div>
    );
};
