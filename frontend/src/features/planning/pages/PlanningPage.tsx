import { usePlanningPage } from '../hooks/usePlanningPage';
import { PlanningFlow } from '../components/PlanningFlow';
import { PlanningTableView } from '../components/PlanningTableView';
import { AddJobModal } from '../components/AddJobModal';
import { CreateInstanceModal } from '../components/CreateInstanceModal';
import { ImportCsvModal } from '../components/ImportCsvModal';
import { EditJobModal } from '../components/EditJobModal';
import type { InstanceStatusType, PlanningPeriod } from '../../../types/planning';
import {
    Plus,
    Archive,
    RotateCcw,
    ArrowRight,
    ArrowDown,
    History,
    TableProperties,
    GitBranch,
    Copy,
    Trash2,
    Upload,
} from 'lucide-react';

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

export const PlanningPage = () => {
    const {
        period,
        setPeriod,
        statusFilter,
        setStatusFilter,
        instances,
        instancesError,
        selectedInstanceId,
        setSelectedInstanceId,
        selectedInstance,
        jobs,
        jobsError,
        loading,
        stats,
        showAddJob,
        setShowAddJob,
        showCreateInstance,
        setShowCreateInstance,
        showImportCsv,
        setShowImportCsv,
        showHistory,
        setShowHistory,
        editingJob,
        setEditingJob,
        viewMode,
        direction,
        cloning,
        fetchInstances,
        fetchJobs,
        handleStatusChange,
        handleDelete,
        handleArchiveInstance,
        handleReactivateInstance,
        handleDeleteInstance,
        handleClone,
        handleCreateIncidentFromJob,
        toggleDirection,
        toggleView,
    } = usePlanningPage();

    return (
        <div className="p-6 max-w-full">
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

            <div className="flex items-center gap-2 mb-4">
                {PERIODS.map((currentPeriod) => (
                    <button
                        key={currentPeriod.value}
                        onClick={() => {
                            setPeriod(currentPeriod.value);
                            setSelectedInstanceId(null);
                        }}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${period === currentPeriod.value
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                    >
                        {currentPeriod.label}
                    </button>
                ))}

                <div className="h-6 w-px bg-slate-200 mx-2" />

                {STATUS_FILTERS.map((filter) => (
                    <button
                        key={filter.value}
                        onClick={() => setStatusFilter(filter.value)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${statusFilter === filter.value
                            ? 'bg-slate-700 text-white'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            {instancesError && (
                <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <span>{instancesError}</span>
                    <button
                        onClick={() => void fetchInstances()}
                        className="rounded-md border border-red-200 bg-white px-3 py-1.5 font-medium text-red-700 hover:bg-red-100"
                    >
                        Retry
                    </button>
                </div>
            )}

            {instances.length > 0 ? (
                <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                        {instances.map((instance) => (
                            <div
                                key={instance.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedInstanceId(instance.id)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        setSelectedInstanceId(instance.id);
                                    }
                                }}
                                className={`group flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all text-left cursor-pointer ${selectedInstanceId === instance.id
                                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}
                            >
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold truncate ${selectedInstanceId === instance.id ? 'text-blue-700' : 'text-slate-700'}`}>
                                        {instance.name}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {instance._count.jobs} jobs · {instance.status}
                                    </p>
                                </div>
                                {instance.status === 'active' && (
                                    <button
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            void handleArchiveInstance(instance.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-amber-600 transition-all"
                                        title="Archive"
                                    >
                                        <Archive className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                {instance.status === 'archived' && (
                                    <button
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            void handleReactivateInstance(instance.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 transition-all"
                                        title="Reactivate"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <button
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        void handleDeleteInstance(instance.id);
                                    }}
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

            {selectedInstance && (
                <>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
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

                            {viewMode === 'flow' && (
                                <button
                                    onClick={toggleDirection}
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                    title={direction === 'LR' ? 'Switch to vertical layout' : 'Switch to horizontal layout'}
                                >
                                    {direction === 'LR' ? <><ArrowDown className="w-4 h-4" /> Vertical</> : <><ArrowRight className="w-4 h-4" /> Horizontal</>}
                                </button>
                            )}

                            {selectedInstance.status === 'active' && (
                                <button
                                    onClick={() => void handleClone()}
                                    disabled={cloning}
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg transition-colors disabled:opacity-50"
                                    title="Clone for next month"
                                >
                                    <Copy className="w-4 h-4" />
                                    {cloning ? 'Cloning...' : 'Clone ->'}
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

                    {jobsError && (
                        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            <span>{jobsError}</span>
                            <button
                                onClick={() => void fetchJobs()}
                                className="rounded-md border border-red-200 bg-white px-3 py-1.5 font-medium text-red-700 hover:bg-red-100"
                            >
                                Retry
                            </button>
                        </div>
                    )}

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

            {showHistory && (
                <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                        <h3 className="font-semibold text-slate-700">Planning History</h3>
                        <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600 transition-colors">x</button>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                        {instances.length === 0 ? (
                            <p className="px-6 py-8 text-center text-slate-400 text-sm">No instances to display.</p>
                        ) : (
                            instances.map((instance) => (
                                <div
                                    key={instance.id}
                                    onClick={() => {
                                        setSelectedInstanceId(instance.id);
                                        setShowHistory(false);
                                    }}
                                    className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">{instance.name}</p>
                                        <p className="text-xs text-slate-400">
                                            {new Date(instance.startDate).toLocaleDateString()} - {new Date(instance.endDate).toLocaleDateString()}
                                            {' '}· Created by {instance.createdBy.name}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-slate-500">{instance._count.jobs} jobs</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${instance.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {instance.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

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
                    void fetchInstances();
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

export default PlanningPage;
