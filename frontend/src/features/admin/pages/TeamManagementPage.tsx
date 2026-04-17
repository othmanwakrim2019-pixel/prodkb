import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, UserPlus, Search } from 'lucide-react';
import { EditTeamModal } from '../components/EditTeamModal';
import { Team, User, TeamMember } from '../../../types';
import { useTranslation } from 'react-i18next';
import { teamService, userService } from '../api/admin.service';
import { Pagination } from '../../../components/ui/Pagination';
import { useToast } from '../../../components/ui/Toast';
import { useConfirm } from '../../../components/ui/ConfirmDialog';

export const TeamManagementPage = () => {
    const { canManageTeams } = useAuth();
    const { t } = useTranslation();
    const toast = useToast();
    const { confirm } = useConfirm();
    const [teams, setTeams] = useState<Team[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
    const [showTeamForm, setShowTeamForm] = useState(false);
    const [showMemberForm, setShowMemberForm] = useState<string | null>(null);
    const [newTeam, setNewTeam] = useState({ name: '', description: '', emailDistribution: '', sendEmail: true });
    const [newMember, setNewMember] = useState({ userId: '', role: '' });
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [teamSearch, setTeamSearch] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

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
            toast.success('Team created successfully!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to create team');
        }
    };

    const handleUpdateTeam = async (updatedTeam: Team) => {
        if (!updatedTeam) return;
        try {
            await teamService.update(updatedTeam.id, {
                name: updatedTeam.name,
                description: updatedTeam.description,
                emailDistribution: updatedTeam.emailDistribution,
                sendEmail: updatedTeam.sendEmail,
            });
            setEditingTeam(null);
            await fetchTeams();
            toast.success('Team updated successfully!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to update team');
        }
    };

    const handleDeleteTeam = async (teamId: string, teamName: string) => {
        if (!await confirm(`Delete team "${teamName}"?`, 'This action cannot be undone.', 'danger')) return;
        try {
            await teamService.delete(teamId);
            await fetchTeams();
            toast.success('Team deleted successfully!');
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e.response?.data?.message || 'Failed to delete team');
        }
    };

    const handleAddTeamMember = async (e: React.FormEvent, teamId: string) => {
        e.preventDefault();
        if (!newMember.userId) { toast.error('Please select a user'); return; }
        try {
            await teamService.addMember(teamId, newMember.userId, newMember.role || 'MEMBER');
            setNewMember({ userId: '', role: '' });
            setShowMemberForm(null);
            await fetchTeams();
            toast.success('Member added successfully!');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message || 'Failed to add member');
        }
    };

    const handleRemoveTeamMember = async (teamId: string, userId: string) => {
        if (!await confirm('Remove team member?', 'This member will be removed from the team.', 'danger')) return;
        try {
            await teamService.removeMember(teamId, userId);
            await fetchTeams();
            toast.success('Team member removed successfully!');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message || 'Failed to remove member');
        }
    };

    const filteredTeams = teams.filter(t =>
        t.name.toLowerCase().includes(teamSearch.toLowerCase())
    );

    return (
        <div className="space-y-4">

            {/* ── Header bar ── */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white self-start">
                    {t('admin.teams.title')}
                </h2>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search teams..."
                            value={teamSearch}
                            onChange={(e) => setTeamSearch(e.target.value)}
                            className="ent-input pl-8 md:w-56"
                        />
                    </div>
                    {canManageTeams() && (
                        <button
                            onClick={() => setShowTeamForm(!showTeamForm)}
                            className="ent-btn-primary whitespace-nowrap"
                        >
                            <Plus className="h-4 w-4" />
                            Create Team
                        </button>
                    )}
                </div>
            </div>

            {/* ── Create Team Form ── */}
            {showTeamForm && (
                <form onSubmit={handleCreateTeam} className="ent-card p-4 space-y-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        New Team
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Team Name *</label>
                            <input
                                type="text"
                                required
                                value={newTeam.name}
                                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                                className="ent-input"
                                placeholder="e.g. Database Team"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Email Distribution</label>
                            <input
                                type="email"
                                value={newTeam.emailDistribution}
                                onChange={(e) => setNewTeam({ ...newTeam, emailDistribution: e.target.value })}
                                className="ent-input"
                                placeholder="team@company.com"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                            <textarea
                                value={newTeam.description}
                                onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                                className="ent-input"
                                rows={2}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newTeam.sendEmail}
                                    onChange={(e) => setNewTeam({ ...newTeam, sendEmail: e.target.checked })}
                                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                                />
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                    Enable email notifications on incident assignment
                                </span>
                            </label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowTeamForm(false)} className="ent-btn-secondary">Cancel</button>
                        <button type="submit" className="ent-btn-primary">Create Team</button>
                    </div>
                </form>
            )}

            {/* ── Teams accordion list ── */}
            <div className="ent-card overflow-hidden">
                {filteredTeams.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400 text-center italic">
                        No teams found.
                    </p>
                ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {filteredTeams.slice((page - 1) * limit, page * limit).map((team) => (
                            <div key={team.id}>
                                {/* ── Row header ── */}
                                <div className="flex items-center px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-none">
                                    {/* Expand toggle */}
                                    <button
                                        onClick={() => setExpandedTeamId(expandedTeamId === team.id ? null : team.id)}
                                        className="mr-3 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                                    >
                                        {expandedTeamId === team.id
                                            ? <ChevronUp className="h-4 w-4" />
                                            : <ChevronDown className="h-4 w-4" />}
                                    </button>

                                    {/* Info */}
                                    <div
                                        className="flex-1 min-w-0 cursor-pointer"
                                        onClick={() => setExpandedTeamId(expandedTeamId === team.id ? null : team.id)}
                                    >
                                        <span className="text-sm font-medium text-slate-900 dark:text-slate-200">
                                            {team.name}
                                        </span>
                                        <span className="ml-3 text-xs text-slate-500 dark:text-slate-400">
                                            {team.members?.length || 0} member{team.members?.length !== 1 ? 's' : ''}
                                            {team.emailDistribution && (
                                                <> · <span className="font-mono">{team.emailDistribution}</span></>
                                            )}
                                            {!(team as Team & { sendEmail?: boolean }).sendEmail && (
                                                <span className="ml-2 ent-lozenge bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                    Notifications off
                                                </span>
                                            )}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    {canManageTeams() && (
                                        <div className="flex items-center gap-1 ml-2">
                                            <button
                                                onClick={() => setEditingTeam(team)}
                                                className="p-1.5 rounded text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors"
                                                title="Edit team"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTeam(team.id, team.name)}
                                                className="p-1.5 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                title="Delete team"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* ── Expanded: members ── */}
                                {expandedTeamId === team.id && (
                                    <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 px-4 py-3 space-y-3">

                                        {/* Description */}
                                        {team.description && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{team.description}</p>
                                        )}

                                        {/* Members header */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Members
                                            </span>
                                            {canManageTeams() && (
                                                <button
                                                    onClick={() => setShowMemberForm(team.id)}
                                                    className="ent-btn-secondary text-xs py-1 px-2"
                                                >
                                                    <UserPlus className="h-3.5 w-3.5" />
                                                    Add Member
                                                </button>
                                            )}
                                        </div>

                                        {/* Add member form */}
                                        {showMemberForm === team.id && (
                                            <form
                                                onSubmit={(e) => handleAddTeamMember(e, team.id)}
                                                className="ent-card p-3 space-y-3"
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">User *</label>
                                                        <select
                                                            required
                                                            value={newMember.userId}
                                                            onChange={(e) => setNewMember({ ...newMember, userId: e.target.value })}
                                                            className="ent-input"
                                                        >
                                                            <option value="">Select user...</option>
                                                            {users.map(u => (
                                                                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g., Developer, Lead"
                                                            value={newMember.role}
                                                            onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                                                            className="ent-input"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <button type="button" onClick={() => setShowMemberForm(null)} className="ent-btn-secondary">Cancel</button>
                                                    <button type="submit" className="ent-btn-primary">Add</button>
                                                </div>
                                            </form>
                                        )}

                                        {/* Members table */}
                                        {team.members && team.members.length > 0 ? (
                                            <div className="ent-card overflow-hidden">
                                                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                                                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                                                        <tr>
                                                            <th className="ent-th">Name</th>
                                                            <th className="ent-th">Email</th>
                                                            <th className="ent-th">Role</th>
                                                            {canManageTeams() && <th className="ent-th text-right">Actions</th>}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                                        {team.members.map((member: TeamMember) => (
                                                            <tr key={member.user.id} className="ent-tr">
                                                                <td className="ent-td font-medium text-slate-900 dark:text-slate-200">{member.user.name}</td>
                                                                <td className="ent-td text-slate-500 dark:text-slate-400">{member.user.email}</td>
                                                                <td className="ent-td">
                                                                    <span className="ent-lozenge bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                                                        {member.role || 'Member'}
                                                                    </span>
                                                                </td>
                                                                {canManageTeams() && (
                                                                    <td className="ent-td text-right">
                                                                        <button
                                                                            onClick={() => handleRemoveTeamMember(team.id, member.user.id)}
                                                                            className="p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                                            title="Remove member"
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </button>
                                                                    </td>
                                                                )}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                                                No members assigned to this team.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination inside card */}
                {filteredTeams.length > 0 && (
                    <Pagination
                        meta={{
                            total: filteredTeams.length,
                            page,
                            limit,
                            totalPages: Math.ceil(filteredTeams.length / limit),
                        }}
                        onPageChange={setPage}
                        onLimitChange={lim => { setLimit(lim); setPage(1); }}
                        limitOptions={[10, 20, 50]}
                    />
                )}
            </div>

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

export default TeamManagementPage;
