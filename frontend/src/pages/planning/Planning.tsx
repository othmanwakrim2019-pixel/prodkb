import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import { PlanningFlow } from './PlanningFlow';
import { PlanningTableView } from './PlanningTableView';
import { AddJobModal } from './AddJobModal';
import { CreateInstanceModal } from './CreateInstanceModal';
import { ImportCsvModal } from './ImportCsvModal';
import { EditJobModal } from './EditJobModal';
import type {
    PlanningInstance,
    PlanningJob,
    PlanningPeriod,
    InstanceStatusType,
} from '../../types/planning';
import { Plus, Archive, RotateCcw, ArrowRight, ArrowDown, History, TableProperties, GitBranch, Copy, Trash2, Upload } from 'lucide-react';

const PERIODS: { value: PlanningPeriod; label: string }[] = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'annual', label: 'Annual' },
];

const STATUS_FILTERS: { value: InstanceStatusType | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'archived', label: 'Archived' },
];

type ViewMode = 'table' | 'flow';

export const Planning = () => {
    const navigate = useNavigate();

    // State
    const [period, setPeriod] = useState<PlanningPeriod>('monthly');
    const [statusFilter, setStatusFilter] = useState<InstanceStatusType | 'all'>('active');
    const [instances, setInstances] = useState<PlanningInstance[]>([]);
    const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
    const [jobs, setJobs] = useState<PlanningJob[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddJob, setShowAddJob] = useState(false);
    const [showCreateInstance, setShowCreateInstance] = useState(false);
    const [showImportCsv, setShowImportCsv] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [editingJob, setEditingJob] = useState<PlanningJob | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        return (localStorage.getItem('planning_view') as ViewMode) || 'table';
    });
    const [direction, setDirection] = useState<'LR' | 'TB'>(() => {
        return (localStorage.getItem('planning_direction') as 'LR' | 'TB') || 'LR';
    });
    const [cloning, setCloning] = useState(false);

    // -- Fetch instances --
    const fetchInstances = useCallback(async () => {
        try {
            const params: Record<string, string> = { period };
            if (statusFilter !== 'all') params.status = statusFilter;
            const res = await axios.get('/api/v1/planning/instances', { params });
            const data = res.data;
            setInstances(Array.isArray(data) ? data : data?.data || []);
        } catch (err) {
            console.error('Failed to fetch instances:', err);
        }
    }, [period, statusFilter]);

    useEffect(() => {
        fetchInstances();
    }, [fetchInstances]);

    // Auto-select first active instance when list changes
    useEffect(() => {
        const active = instances.find(i => i.status === 'active');
        if (active && !selectedInstanceId) {
            setSelectedInstanceId(active.id);
        } else if (instances.length > 0 && !instances.find(i => i.id === selectedInstanceId)) {
            setSelectedInstanceId(instances[0]?.id || null);
        } else if (instances.length === 0) {
            setSelectedInstanceId(null);
        }
    }, [instances, selectedInstanceId]);

    // -- Fetch jobs for selected instance --
    const fetchJobs = useCallback(async () => {
        if (!selectedInstanceId) {
            setJobs([]);
            return;
        }
        setLoading(true);
        try {
            const res = await axios.get(`/api/v1/planning/instances/${selectedInstanceId}/jobs`);
            const data = res.data;
            setJobs(Array.isArray(data) ? data : data?.data || []);
        } catch (err) {
            console.error('Failed to fetch jobs:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedInstanceId]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    // -- Handlers --
    const handleStatusChange = useCallback(async (jobId: string, newStatus: string) => {
        try {
            await axios.patch(`/api/v1/planning/jobs/${jobId}/status`, { status: newStatus });
            await fetchJobs();
        } catch (err) {
            console.error('Failed to update status:', err);
            alert('Failed to update job status. The transition may not be allowed.');
        }
    }, [fetchJobs]);

    const handleDelete = useCallback(async (jobId: string) => {
        if (!confirm('Are you sure you want to remove this job from the plan?')) return;
        try {
            await axios.delete(`/api/v1/planning/jobs/${jobId}`);
            await fetchJobs();
        } catch (err) {
            console.error('Failed to delete job:', err);
        }
    }, [fetchJobs]);

    const handleArchiveInstance = useCallback(async (instanceId: string) => {
        try {
            await axios.patch(`/api/v1/planning/instances/${instanceId}/archive`);
            await fetchInstances();
        } catch (err) {
            console.error('Failed to archive instance:', err);
        }
    }, [fetchInstances]);

    const handleReactivateInstance = useCallback(async (instanceId: string) => {
        try {
            await axios.patch(`/api/v1/planning/instances/${instanceId}/reactivate`);
            await fetchInstances();
        } catch (err) {
            console.error('Failed to reactivate instance:', err);
        }
    }, [fetchInstances]);

    const handleDeleteInstance = useCallback(async (instanceId: string) => {
        if (!confirm('⚠️ Are you sure you want to permanently delete this planning instance and ALL its tasks? This cannot be undone.')) return;
        try {
            await axios.delete(`/api/v1/planning/instances/${instanceId}`);
            if (selectedInstanceId === instanceId) setSelectedInstanceId(null);
            await fetchInstances();
        } catch (err) {
            console.error('Failed to delete instance:', err);
        }
    }, [fetchInstances, selectedInstanceId]);

    const handleClone = useCallback(async () => {
        if (!selectedInstanceId) return;
        if (!confirm('Clone this planning instance for next month? All tasks will be reset to Pending.')) return;
        setCloning(true);
        try {
            const res = await axios.post(`/api/v1/planning/instances/${selectedInstanceId}/clone`);
            const cloned = res.data?.data;
            await fetchInstances();
            if (cloned?.id) setSelectedInstanceId(cloned.id);
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Failed to clone planning instance.');
        } finally {
            setCloning(false);
        }
    }, [selectedInstanceId, fetchInstances]);

    const handleCreateIncidentFromJob = useCallback((job: PlanningJob) => {
        const taskName = job.customTaskName || job.job?.name || 'Unknown Task';
        const taskCode = job.job?.code || 'MANUAL';
        // Navigate to create incident with pre-filled data via state
        navigate('/incidents/create', {
            state: {
                prefill: {
                    title: `[PLANNING] ${taskName} failed`,
                    systemId: job.systemId || undefined,
                    jobId: job.jobId || undefined,
                    description: `Task "${taskName}" (${taskCode}) scheduled for ${new Date(job.scheduledTime).toLocaleDateString('fr-FR')} has failed during the Fin de Mois procedure.`,
                    severity: 'HIGH',
                }
            }
        });
    }, [navigate]);

    const toggleDirection = () => {
        const next = direction === 'LR' ? 'TB' : 'LR';
        setDirection(next);
        localStorage.setItem('planning_direction', next);
    };

    const toggleView = (mode: ViewMode) => {
        setViewMode(mode);
        localStorage.setItem('planning_view', mode);
    };

    const selectedInstance = instances.find(i => i.id === selectedInstanceId);

    // -- Stats --
    const stats = {
        pending: jobs.filter(j => j.status === 'pending').length,
        running: jobs.filter(j => j.status === 'running').length,
        done: jobs.filter(j => j.status === 'done').length,
        failed: jobs.filter(j => j.status === 'failed').length,
        blocked: jobs.filter(j => j.status === 'blocked').length,
        total: jobs.length,
    };

    return (
        <div className="p-6 max-w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Planning & Scheduling</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage end-of-month procedures and job execution chains</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${showHistory ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                        <History className="w-4 h-4" /> History
                    </button>
                    <button
                        onClick={() => setShowImportCsv(true)}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                        <Upload className="w-4 h-4" /> Import CSV
                    </button>
                    <button
                        onClick={() => setShowCreateInstance(true)}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> New Instance
                    </button>
                </div>
            </div>

            {/* Period Tabs */}
            <div className="flex items-center gap-2 mb-4">
                {PERIODS.map(p => (
                    <button
                        key={p.value}
                        onClick={() => { setPeriod(p.value); setSelectedInstanceId(null); }}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${period === p.value
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                    >
                        {p.label}
                    </button>
                ))}

                <div className="h-6 w-px bg-slate-200 mx-2" />

                {STATUS_FILTERS.map(sf => (
                    <button
                        key={sf.value}
                        onClick={() => setStatusFilter(sf.value)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${statusFilter === sf.value
                            ? 'bg-slate-700 text-white'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                        {sf.label}
                    </button>
                ))}
            </div>

            {/* Instance Selector */}
            {instances.length > 0 ? (
                <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                        {instances.map(inst => (
                            <div
                                key={inst.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedInstanceId(inst.id)}
                                onKeyDown={e => e.key === 'Enter' && setSelectedInstanceId(inst.id)}
                                className={`group flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all text-left cursor-pointer ${selectedInstanceId === inst.id
                                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}
                            >
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold truncate ${selectedInstanceId === inst.id ? 'text-blue-700' : 'text-slate-700'}`}>
                                        {inst.name}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {inst._count.jobs} jobs · {inst.status}
                                    </p>
                                </div>
                                {inst.status === 'active' && (
                                    <button
                                        onClick={e => { e.stopPropagation(); handleArchiveInstance(inst.id); }}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-amber-600 transition-all"
                                        title="Archive"
                                    >
                                        <Archive className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                {inst.status === 'archived' && (
                                    <button
                                        onClick={e => { e.stopPropagation(); handleReactivateInstance(inst.id); }}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 transition-all"
                                        title="Reactivate"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <button
                                    onClick={e => { e.stopPropagation(); handleDeleteInstance(inst.id); }}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 transition-all"
                                    title="Delete permanently"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="mb-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 p-8 text-center">
                    <p className="text-slate-500 mb-3">No planning instances for {period} period.</p>
                    <button
                        onClick={() => setShowCreateInstance(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4" /> Create First Instance
                    </button>
                </div>
            )}

            {/* Selected Instance Content */}
            {selectedInstance && (
                <>
                    {/* Toolbar */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            {/* Stats */}
                            <div className="flex items-center gap-2 text-sm flex-wrap">
                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                                    <span className="w-2 h-2 rounded-full bg-slate-400" /> {stats.pending} Pending
                                </span>
                                {stats.running > 0 && (
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                                        <span className="w-2 h-2 rounded-full bg-blue-500" /> {stats.running} Running
                                    </span>
                                )}
                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> {stats.done} Done
                                </span>
                                {stats.failed > 0 && (
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700">
                                        <span className="w-2 h-2 rounded-full bg-red-500" /> {stats.failed} Failed
                                    </span>
                                )}
                                {stats.blocked > 0 && (
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                                        <span className="w-2 h-2 rounded-full bg-amber-400" /> {stats.blocked} Blocked
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* View mode toggle */}
                            <div className="flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden">
                                <button
                                    onClick={() => toggleView('table')}
                                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <TableProperties className="w-4 h-4" /> Table
                                </button>
                                <div className="w-px h-6 bg-slate-200" />
                                <button
                                    onClick={() => toggleView('flow')}
                                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${viewMode === 'flow' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <GitBranch className="w-4 h-4" /> Flow
                                </button>
                            </div>

                            {/* Flow direction toggle (only in flow mode) */}
                            {viewMode === 'flow' && (
                                <button
                                    onClick={toggleDirection}
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                    title={direction === 'LR' ? 'Switch to vertical layout' : 'Switch to horizontal layout'}
                                >
                                    {direction === 'LR' ? <><ArrowDown className="w-4 h-4" /> Vertical</> : <><ArrowRight className="w-4 h-4" /> Horizontal</>}
                                </button>
                            )}

                            {/* Clone for next month */}
                            {selectedInstance.status === 'active' && (
                                <button
                                    onClick={handleClone}
                                    disabled={cloning}
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg transition-colors disabled:opacity-50"
                                    title="Clone for next month"
                                >
                                    <Copy className="w-4 h-4" />
                                    {cloning ? 'Cloning...' : 'Clone →'}
                                </button>
                            )}

                            {selectedInstance.status === 'active' && (
                                <button
                                    onClick={() => setShowAddJob(true)}
                                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    <Plus className="w-4 h-4" /> Add Job
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="flex items-center justify-center h-[500px]">
                            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                        </div>
                    ) : viewMode === 'table' ? (
                        <PlanningTableView
                            jobs={jobs}
                            instanceStatus={selectedInstance.status}
                            onRefresh={fetchJobs}
                            onCreateIncident={handleCreateIncidentFromJob}
                            onEditJob={(job) => setEditingJob(job)}
                        />
                    ) : (
                        <PlanningFlow
                            jobs={jobs}
                            onStatusChange={handleStatusChange}
                            onDelete={handleDelete}
                            direction={direction}
                        />
                    )}
                </>
            )}

            {/* History Panel */}
            {showHistory && (
                <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                        <h3 className="font-semibold text-slate-700">Planning History</h3>
                        <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                        {instances.length === 0 ? (
                            <p className="px-6 py-8 text-center text-slate-400 text-sm">No instances to display.</p>
                        ) : (
                            instances.map(inst => (
                                <div
                                    key={inst.id}
                                    onClick={() => { setSelectedInstanceId(inst.id); setShowHistory(false); }}
                                    className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">{inst.name}</p>
                                        <p className="text-xs text-slate-400">
                                            {new Date(inst.startDate).toLocaleDateString()} – {new Date(inst.endDate).toLocaleDateString()}
                                            &nbsp;· Created by {inst.createdBy.name}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-slate-500">{inst._count.jobs} jobs</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${inst.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {inst.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Modals */}
            <CreateInstanceModal
                isOpen={showCreateInstance}
                onClose={() => setShowCreateInstance(false)}
                onCreated={fetchInstances}
                period={period}
            />

            {selectedInstanceId && (
                <AddJobModal
                    isOpen={showAddJob}
                    onClose={() => setShowAddJob(false)}
                    onCreated={fetchJobs}
                    instanceId={selectedInstanceId}
                    existingJobs={jobs}
                />
            )}

            <ImportCsvModal
                isOpen={showImportCsv}
                onClose={() => setShowImportCsv(false)}
                onImported={(newInstanceId) => {
                    fetchInstances();
                    setSelectedInstanceId(newInstanceId);
                }}
            />

            <EditJobModal
                job={editingJob}
                isOpen={editingJob !== null}
                onClose={() => setEditingJob(null)}
                onSaved={fetchJobs}
                existingJobs={jobs}
            />
        </div>
    );
};

export default Planning;

