import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plus, Search as SearchIcon, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { System, Team, Job } from '../../types';
import { useTranslation } from 'react-i18next';
import { systemService, teamService, jobService } from '../../services/admin.service';
import { Pagination } from '../../components/ui/Pagination';

export const SystemManagement = () => {
    const { canManageSystems } = useAuth();
    const { t } = useTranslation();
    const [systems, setSystems] = useState<System[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [systemSearch, setSystemSearch] = useState('');
    const [showSystemForm, setShowSystemForm] = useState(false);
    const [showJobForm, setShowJobForm] = useState<string | null>(null);
    const [expandedSystemId, setExpandedSystemId] = useState<string | null>(null);
    const [newSystem, setNewSystem] = useState({ name: '', description: '' });
    const [newJob, setNewJob] = useState({ name: '', code: '', systemId: '', teamId: '' });
    const [editingSystem, setEditingSystem] = useState<System | null>(null);
    const [editingJob, setEditingJob] = useState<Job | null>(null);
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        fetchSystems();
        fetchTeams();
    }, []);

    const fetchSystems = async () => {
        try {
            const data = await systemService.getAll();
            setSystems(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch systems', error);
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

    const handleCreateSystem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await systemService.create(newSystem);
            setNewSystem({ name: '', description: '' });
            setShowSystemForm(false);
            await fetchSystems();
            alert('System created successfully!');
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreateJob = async (e: React.FormEvent, systemId: string) => {
        e.preventDefault();
        try {
            await jobService.create({
                ...newJob,
                systemId,
                teamId: newJob.teamId || undefined
            });
            setNewJob({ name: '', code: '', systemId: '', teamId: '' });
            setShowJobForm(null);
            await fetchSystems();
            alert('Job created successfully!');
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdateSystem = async () => {
        if (!editingSystem) return;
        try {
            await systemService.update(editingSystem.id, {
                name: editingSystem.name,
                description: editingSystem.description
            });
            setEditingSystem(null);
            await fetchSystems();
            alert('System updated successfully!');
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteSystem = async (systemId: string, systemName: string) => {
        if (!confirm(`Supprimer le système "${systemName}" ?`)) return;
        try {
            await systemService.delete(systemId);
            await fetchSystems();
            alert('Système supprimé avec succès !');
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            alert(e.response?.data?.message || 'Échec de la suppression du système.');
        }
    };

    const handleUpdateJob = async () => {
        if (!editingJob) return;
        try {
            await jobService.update(editingJob.id, {
                name: editingJob.name,
                code: editingJob.code,
                systemId: editingJob.systemId,
                teamId: editingJob.teamId || undefined
            });
            setEditingJob(null);
            await fetchSystems();
            alert('Job updated successfully!');
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteJob = async (jobId: string, jobName: string) => {
        if (!confirm(`Supprimer le job "${jobName}" ?`)) return;
        try {
            await jobService.delete(jobId);
            await fetchSystems();
            alert('Job supprimé avec succès !');
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            alert(e.response?.data?.message || 'Échec de la suppression du job.');
        }
    };

    const filteredSystems = systems.filter(s =>
        s.name.toLowerCase().includes(systemSearch.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-lg font-semibold text-slate-900">{t('admin.systems.title')}</h2>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search applications..."
                            value={systemSearch}
                            onChange={(e) => setSystemSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:border-accent focus:ring-accent sm:text-sm w-full"
                        />
                    </div>
                    {canManageSystems() && (
                        <button
                            onClick={() => setShowSystemForm(!showSystemForm)}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Application
                        </button>
                    )}
                </div>
            </div>

            {showSystemForm && (
                <form onSubmit={handleCreateSystem} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-4">
                    <h3 className="font-medium text-slate-900">Create New System</h3>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Application Name</label>
                            <input
                                type="text"
                                required
                                value={newSystem.name}
                                onChange={(e) => setNewSystem({ ...newSystem, name: e.target.value })}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea
                                value={newSystem.description}
                                onChange={(e) => setNewSystem({ ...newSystem, description: e.target.value })}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                rows={3}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setShowSystemForm(false)}
                            className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800"
                        >
                            Create Application
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-4">
                {filteredSystems.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE).map((system) => (
                    <div key={system.id} className="bg-white shadow-sm rounded-lg border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-4 cursor-pointer" onClick={() => setExpandedSystemId(expandedSystemId === system.id ? null : system.id)}>
                                {expandedSystemId === system.id ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
                                <div>
                                    <h3 className="text-lg font-medium text-slate-900">{system.name}</h3>
                                    {system.description && <p className="text-sm text-slate-500">{system.description}</p>}
                                </div>
                            </div>
                            {canManageSystems() && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setEditingSystem(system)}
                                        className="text-slate-400 hover:text-accent"
                                        title="Edit system"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteSystem(system.id, system.name)}
                                        className="text-slate-400 hover:text-red-600"
                                        title="Delete system"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {expandedSystemId === system.id && (
                            <div className="px-6 py-4 border-t border-slate-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-medium text-slate-900">Uprocs (Jobs)</h4>
                                    {canManageSystems() && (
                                        <button
                                            onClick={() => setShowJobForm(system.id)}
                                            className="text-sm text-accent hover:text-blue-800 font-medium flex items-center"
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add Uproc
                                        </button>
                                    )}
                                </div>

                                {showJobForm === system.id && (
                                    <form onSubmit={(e) => handleCreateJob(e, system.id)} className="bg-slate-50 p-4 rounded-md mb-4 border border-slate-200">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Name (Description)</label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="e.g., Daily Payment Processing"
                                                    value={newJob.name}
                                                    onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
                                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent text-sm p-1 border"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Code (Technical ID)</label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="e.g., PAY_BATCH_001"
                                                    value={newJob.code}
                                                    onChange={(e) => setNewJob({ ...newJob, code: e.target.value })}
                                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent text-sm p-1 border"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Owning Team</label>
                                                <select
                                                    value={newJob.teamId}
                                                    onChange={(e) => setNewJob({ ...newJob, teamId: e.target.value })}
                                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent text-sm p-1 border"
                                                >
                                                    <option value="">No specific team</option>
                                                    {teams.map(team => (
                                                        <option key={team.id} value={team.id}>{team.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowJobForm(null)}
                                                className="px-3 py-1 border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-white"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-3 py-1 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-primary hover:bg-slate-800"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {system.jobs && system.jobs.length > 0 ? (
                                    <table className="min-w-full divide-y divide-slate-200">
                                        <thead>
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Code</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Team</th>
                                                {canManageSystems() && <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {system.jobs.map((job: Job) => (
                                                <tr key={job.id}>
                                                    <td className="px-3 py-2 text-sm font-mono text-slate-700">{job.code}</td>
                                                    <td className="px-3 py-2 text-sm text-slate-700">{job.name}</td>
                                                    <td className="px-3 py-2 text-sm text-slate-500">{teams.find(t => t.id === job.teamId)?.name || '-'}</td>
                                                    {canManageSystems() && (
                                                        <td className="px-3 py-2 text-right text-sm">
                                                            <button
                                                                onClick={() => setEditingJob(job)}
                                                                className="text-accent hover:text-blue-900 mr-2"
                                                            >
                                                                <Pencil className="h-3 w-3" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteJob(job.id, job.name)}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="text-sm text-slate-500 italic">No uprocs defined for this system.</p>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {filteredSystems.length > ITEMS_PER_PAGE && (
                <Pagination
                    meta={{
                        total: filteredSystems.length,
                        page,
                        limit: ITEMS_PER_PAGE,
                        totalPages: Math.ceil(filteredSystems.length / ITEMS_PER_PAGE),
                    }}
                    onPageChange={setPage}
                />
            )}

            {/* Edit System Modal */}
            {editingSystem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full m-4">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('admin.systems.editSystem')}</h3>
                        <div className="grid grid-cols-1 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={editingSystem.name}
                                    onChange={(e) => setEditingSystem({ ...editingSystem, name: e.target.value })}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    value={editingSystem.description || ''}
                                    onChange={(e) => setEditingSystem({ ...editingSystem, description: e.target.value })}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setEditingSystem(null)}
                                className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateSystem}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Job Modal */}
            {editingJob && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full m-4">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Edit Uproc</h3>
                        <div className="grid grid-cols-1 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name (Description)</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Daily Payment Processing"
                                    value={editingJob.name}
                                    onChange={(e) => setEditingJob({ ...editingJob, name: e.target.value })}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Code (Technical ID)</label>
                                <input
                                    type="text"
                                    placeholder="e.g., PAY_BATCH_001"
                                    value={editingJob.code}
                                    onChange={(e) => setEditingJob({ ...editingJob, code: e.target.value })}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Owning Team</label>
                                <select
                                    value={editingJob.teamId}
                                    onChange={(e) => setEditingJob({ ...editingJob, teamId: e.target.value })}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                >
                                    <option value="">No specific team</option>
                                    {teams.map(team => (
                                        <option key={team.id} value={team.id}>{team.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setEditingJob(null)}
                                className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateJob}
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
