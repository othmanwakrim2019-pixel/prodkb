import { useState } from 'react';
import type { PlanningJob, PlanningStatusType } from './planning.types';
import { CheckCircle, XCircle, Play, Clock, Ban, AlertTriangle, User, Cpu, AlertCircle } from 'lucide-react';
import axios from '../../utils/axios';

interface Props {
    jobs: PlanningJob[];
    instanceStatus: 'active' | 'archived';
    onRefresh: () => void;
    onCreateIncident?: (job: PlanningJob) => void;
}

const STATUS_CONFIG: Record<PlanningStatusType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    pending: { label: 'Pending', color: 'text-slate-600', bg: 'bg-slate-100', icon: <Clock className="w-3.5 h-3.5" /> },
    running: { label: 'Running', color: 'text-blue-700', bg: 'bg-blue-100', icon: <Play className="w-3.5 h-3.5" /> },
    done: { label: 'Done', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: <CheckCircle className="w-3.5 h-3.5" /> },
    failed: { label: 'Failed', color: 'text-red-700', bg: 'bg-red-100', icon: <XCircle className="w-3.5 h-3.5" /> },
    blocked: { label: 'Blocked', color: 'text-amber-700', bg: 'bg-amber-100', icon: <Ban className="w-3.5 h-3.5" /> },
};

interface ConfirmNoteModalProps {
    jobName: string;
    onConfirm: (note: string) => void;
    onCancel: () => void;
}

const ConfirmNoteModal = ({ jobName, onConfirm, onCancel }: ConfirmNoteModalProps) => {
    const [note, setNote] = useState('');
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <h3 className="font-semibold text-slate-800 mb-1">Confirm Task Done</h3>
                <p className="text-sm text-slate-500 mb-4">
                    <span className="font-medium text-slate-700">{jobName}</span>
                    <br />Please confirm this task is completed by providing a short note.
                </p>
                <textarea
                    autoFocus
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder='e.g. "Toutes les agences fermées à 18h30"'
                />
                <div className="flex gap-2 justify-end mt-4">
                    <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(note)}
                        disabled={!note.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors"
                    >
                        ✅ Confirm Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export const PlanningTableView = ({ jobs, instanceStatus, onRefresh, onCreateIncident }: Props) => {
    const [confirmJob, setConfirmJob] = useState<PlanningJob | null>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const updateStatus = async (job: PlanningJob, newStatus: PlanningStatusType, notes?: string) => {
        setLoadingId(job.id);
        try {
            await axios.patch(`/api/v1/planning/jobs/${job.id}/status`, { status: newStatus, notes });
            onRefresh();
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Failed to update status.');
        } finally {
            setLoadingId(null);
        }
    };

    const handleMarkDone = (job: PlanningJob) => {
        if (job.taskType === 'MANUAL_ACTION') {
            setConfirmJob(job);
        } else {
            updateStatus(job, 'done');
        }
    };

    const totalDone = jobs.filter(j => j.status === 'done').length;
    const progress = jobs.length > 0 ? Math.round((totalDone / jobs.length) * 100) : 0;

    const isEditable = instanceStatus === 'active';

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Progress Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">
                        {totalDone} / {jobs.length} tasks completed
                    </span>
                    <span className="text-sm font-bold text-slate-700">{progress}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-10">#</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-24">Date</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-10">Type</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Task</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-36">Support</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-28">Status</th>
                            {isEditable && (
                                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-48">Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {jobs.map((job, idx) => {
                            const statusCfg = STATUS_CONFIG[job.status];
                            const isBlocked = job.status === 'blocked';
                            const isDone = job.status === 'done';
                            const isFailed = job.status === 'failed';
                            const isRunning = job.status === 'running';
                            const isPending = job.status === 'pending';
                            const isLoading = loadingId === job.id;
                            const isBatch = job.taskType === 'BATCH';

                            return (
                                <tr
                                    key={job.id}
                                    className={`transition-colors ${isDone ? 'bg-emerald-50/30' : isFailed ? 'bg-red-50/30' : isBlocked ? 'bg-amber-50/20 opacity-70' : 'hover:bg-slate-50/60'}`}
                                >
                                    {/* # */}
                                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{idx + 1}</td>

                                    {/* Date */}
                                    <td className="px-4 py-3">
                                        <div className="text-xs text-slate-500">
                                            {new Date(job.scheduledTime).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {new Date(job.scheduledTime).toLocaleDateString('fr-FR', { weekday: 'short' })}
                                        </div>
                                    </td>

                                    {/* Type icon */}
                                    <td className="px-4 py-3">
                                        <span title={isBatch ? 'Automated Batch Job' : 'Manual Action'}>
                                            {isBatch
                                                ? <Cpu className="w-4 h-4 text-blue-400" />
                                                : <User className="w-4 h-4 text-violet-400" />
                                            }
                                        </span>
                                    </td>

                                    {/* Task name */}
                                    <td className="px-4 py-3">
                                        <div className={`font-medium ${isDone ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                            {job.job.name}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-0.5">{job.system.name}</div>
                                        {job.notes && (
                                            <div className="text-xs text-emerald-600 mt-1 italic">"{job.notes}"</div>
                                        )}
                                        {job.launchedAt && !job.completedAt && (
                                            <div className="text-xs text-blue-500 mt-0.5">
                                                Launched {new Date(job.launchedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} by {job.launchedBy?.name}
                                            </div>
                                        )}
                                        {job.completedAt && (
                                            <div className="text-xs text-emerald-600 mt-0.5">
                                                ✓ {new Date(job.completedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} by {job.completedBy?.name}
                                            </div>
                                        )}
                                    </td>

                                    {/* Support contact */}
                                    <td className="px-4 py-3">
                                        {job.supportContact ? (
                                            <span className="inline-flex items-center gap-1 text-xs text-violet-600 bg-violet-50 rounded-full px-2 py-0.5">
                                                <User className="w-3 h-3" /> {job.supportContact}
                                            </span>
                                        ) : (
                                            <span className="text-slate-300 text-xs">—</span>
                                        )}
                                    </td>

                                    {/* Status badge */}
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>
                                            {statusCfg.icon}
                                            {statusCfg.label}
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    {isEditable && (
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {isLoading && (
                                                    <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                                                )}

                                                {/* BATCH: Launch button */}
                                                {isBatch && isPending && !isLoading && (
                                                    <button
                                                        onClick={() => updateStatus(job, 'running')}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                                    >
                                                        <Play className="w-3 h-3" /> Launch
                                                    </button>
                                                )}

                                                {/* Mark Done (BATCH running, or MANUAL pending) */}
                                                {(isRunning || (job.taskType === 'MANUAL_ACTION' && isPending)) && !isLoading && (
                                                    <button
                                                        onClick={() => handleMarkDone(job)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                                                    >
                                                        <CheckCircle className="w-3 h-3" /> Done
                                                    </button>
                                                )}

                                                {/* Mark failed */}
                                                {(isPending || isRunning || isBlocked) && !isLoading && (
                                                    <button
                                                        onClick={() => updateStatus(job, 'failed')}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                    >
                                                        <XCircle className="w-3 h-3" /> Failed
                                                    </button>
                                                )}

                                                {/* Create incident from failure */}
                                                {isFailed && onCreateIncident && !isLoading && (
                                                    <button
                                                        onClick={() => onCreateIncident(job)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                                                    >
                                                        <AlertTriangle className="w-3 h-3" /> Create Incident
                                                    </button>
                                                )}

                                                {/* Reopen completed/failed */}
                                                {(isDone || isFailed) && !isLoading && (
                                                    <button
                                                        onClick={() => updateStatus(job, 'pending')}
                                                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                        title="Reopen task"
                                                    >
                                                        <AlertCircle className="w-3.5 h-3.5" />
                                                    </button>
                                                )}

                                                {/* Unblock: reopen blocked */}
                                                {isBlocked && !isLoading && (
                                                    <button
                                                        onClick={() => updateStatus(job, 'pending')}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                                                    >
                                                        <AlertCircle className="w-3 h-3" /> Unblock
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {jobs.length === 0 && (
                    <div className="py-12 text-center text-slate-400 text-sm">
                        No tasks in this planning instance yet.
                    </div>
                )}
            </div>

            {/* MANUAL_ACTION Confirmation Modal */}
            {confirmJob && (
                <ConfirmNoteModal
                    jobName={confirmJob.job.name}
                    onConfirm={(note) => {
                        updateStatus(confirmJob, 'done', note);
                        setConfirmJob(null);
                    }}
                    onCancel={() => setConfirmJob(null)}
                />
            )}
        </div>
    );
};
