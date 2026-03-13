import { useState } from 'react';
import type { PlanningJob, PlanningStatusType } from '../../../types/planning';
import { CheckCircle, XCircle, Play, Clock, Ban, AlertTriangle, User, Cpu, AlertCircle, Trash2, Pencil } from 'lucide-react';
import { planningService } from '../api/planning.service';

interface Props {
    jobs: PlanningJob[];
    instanceStatus: 'active' | 'archived';
    onRefresh: () => void;
    onCreateIncident?: (job: PlanningJob) => void;
    onEditJob?: (job: PlanningJob) => void;
}

const STATUS_CONFIG: Record<PlanningStatusType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    pending: { label: 'En attente', color: 'text-slate-600', bg: 'bg-slate-100', icon: <Clock className="w-3.5 h-3.5" /> },
    running: { label: 'En cours', color: 'text-blue-700', bg: 'bg-blue-100', icon: <Play className="w-3.5 h-3.5 animate-pulse" /> },
    done: { label: 'Terminé', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: <CheckCircle className="w-3.5 h-3.5" /> },
    failed: { label: 'Échoué', color: 'text-red-700', bg: 'bg-red-100', icon: <XCircle className="w-3.5 h-3.5" /> },
    blocked: { label: 'Bloqué', color: 'text-amber-700', bg: 'bg-amber-100', icon: <Ban className="w-3.5 h-3.5" /> },
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
                <h3 className="font-semibold text-slate-800 mb-1">Confirmer la tâche terminée</h3>
                <p className="text-sm text-slate-500 mb-4">
                    <span className="font-medium text-slate-700">{jobName}</span>
                    <br />Veuillez confirmer avec une note de clôture.
                </p>
                <textarea
                    autoFocus
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder='ex. "Toutes les agences fermées à 18h30"'
                />
                <div className="flex gap-2 justify-end mt-4">
                    <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        Annuler
                    </button>
                    <button
                        onClick={() => onConfirm(note)}
                        disabled={!note.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors"
                    >
                        ✅ Confirmer
                    </button>
                </div>
            </div>
        </div>
    );
};

export const PlanningTableView = ({ jobs, instanceStatus, onRefresh, onCreateIncident, onEditJob }: Props) => {
    const [confirmJob, setConfirmJob] = useState<PlanningJob | null>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Sort jobs by scheduledTime ascending (date order respected)
    const sortedJobs = [...jobs].sort((a, b) =>
        new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    );

    const updateStatus = async (job: PlanningJob, newStatus: PlanningStatusType, notes?: string) => {
        setLoadingId(job.id);
        setError(null);
        try {
            await planningService.updateJobStatus(job.id, newStatus, notes);
            onRefresh();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
                || 'Impossible de mettre à jour le statut.';
            setError(msg);
            // Auto-dismiss after 5s
            setTimeout(() => setError(null), 5000);
        } finally {
            setLoadingId(null);
        }
    };

    const handleDelete = async (job: PlanningJob) => {
        const taskLabel = job.customTaskName || job.job?.name || 'cette tâche';
        if (!confirm(`Supprimer "${taskLabel}" ? Cette action est irréversible.`)) return;
        setLoadingId(job.id);
        try {
            await planningService.deleteJob(job.id);
            onRefresh();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
                || 'Impossible de supprimer la tâche.';
            setError(msg);
            setTimeout(() => setError(null), 5000);
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
                        {totalDone} / {jobs.length} tâches terminées
                    </span>
                    <span className="text-sm font-bold text-slate-700">{progress}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Error banner */}
                {error && (
                    <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-10">#</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-28">Date / Heure</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-10">Type</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tâche</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-36">Responsable</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-28">Statut</th>
                            {isEditable && (
                                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-56">Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {sortedJobs.map((job, idx) => {
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
                                    className={`transition-colors ${isDone ? 'bg-emerald-50/30' : isFailed ? 'bg-red-50/30' : isRunning ? 'bg-blue-50/30' : isBlocked ? 'bg-amber-50/20 opacity-70' : 'hover:bg-slate-50/60'}`}
                                >
                                    {/* # */}
                                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{idx + 1}</td>

                                    {/* Date + Time */}
                                    <td className="px-4 py-3">
                                        <div className="text-xs font-medium text-slate-700">
                                            {new Date(job.scheduledTime).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {new Date(job.scheduledTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            {' · '}
                                            {new Date(job.scheduledTime).toLocaleDateString('fr-FR', { weekday: 'short' })}
                                        </div>
                                    </td>

                                    {/* Type icon */}
                                    <td className="px-4 py-3">
                                        <span title={isBatch ? 'Traitement automatique (Batch)' : 'Action manuelle'}>
                                            {isBatch
                                                ? <Cpu className="w-4 h-4 text-blue-400" />
                                                : <User className="w-4 h-4 text-violet-400" />
                                            }
                                        </span>
                                    </td>

                                    {/* Task name */}
                                    <td className="px-4 py-3">
                                        <div className={`font-medium ${isDone ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                            {job.customTaskName || job.job?.name || 'Sans titre'}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-0.5">{job.system?.name || (job.customTaskName ? 'Action manuelle' : '')}</div>
                                        {job.notes && (
                                            <div className="text-xs text-emerald-600 mt-1 italic">"{job.notes}"</div>
                                        )}
                                        {isRunning && job.launchedAt && (
                                            <div className="text-xs text-blue-500 mt-0.5">
                                                ▶ Démarré à {new Date(job.launchedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                {job.launchedBy ? ` par ${job.launchedBy.name}` : ''}
                                            </div>
                                        )}
                                        {isDone && job.completedAt && (
                                            <div className="text-xs text-emerald-600 mt-0.5">
                                                ✓ Terminé à {new Date(job.completedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                {job.completedBy ? ` par ${job.completedBy.name}` : ''}
                                            </div>
                                        )}
                                        {/* Dependency indicators */}
                                        {job.dependencies.length > 0 && (
                                            <div className="text-xs text-slate-300 mt-0.5">
                                                ⛓ {job.dependencies.length} dépendance{job.dependencies.length > 1 ? 's' : ''}
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
                                            <div className="flex items-center justify-end gap-1">
                                                {isLoading && (
                                                    <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                                                )}

                                                {/* Start (pending → running) — both BATCH and MANUAL */}
                                                {isPending && !isLoading && (
                                                    <button
                                                        onClick={() => updateStatus(job, 'running')}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                                        title="Démarrer"
                                                    >
                                                        <Play className="w-3 h-3" /> Démarrer
                                                    </button>
                                                )}

                                                {/* Mark Done (running → done) */}
                                                {isRunning && !isLoading && (
                                                    <button
                                                        onClick={() => handleMarkDone(job)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                                                        title="Marquer terminé"
                                                    >
                                                        <CheckCircle className="w-3 h-3" /> Terminé
                                                    </button>
                                                )}

                                                {/* Mark Failed (pending or running) */}
                                                {(isPending || isRunning || isBlocked) && !isLoading && (
                                                    <button
                                                        onClick={() => updateStatus(job, 'failed')}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                        title="Marquer échoué"
                                                    >
                                                        <XCircle className="w-3 h-3" /> Échoué
                                                    </button>
                                                )}

                                                {/* Create incident after failure */}
                                                {isFailed && onCreateIncident && !isLoading && (
                                                    <button
                                                        onClick={() => onCreateIncident(job)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                                                        title="Créer un incident"
                                                    >
                                                        <AlertTriangle className="w-3 h-3" /> Incident
                                                    </button>
                                                )}

                                                {/* Reopen (done/failed → pending) */}
                                                {(isDone || isFailed) && !isLoading && (
                                                    <button
                                                        onClick={() => updateStatus(job, 'pending')}
                                                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                        title="Réouvrir"
                                                    >
                                                        <AlertCircle className="w-3.5 h-3.5" />
                                                    </button>
                                                )}

                                                {/* Unblock */}
                                                {isBlocked && !isLoading && (
                                                    <button
                                                        onClick={() => updateStatus(job, 'pending')}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                                                    >
                                                        <AlertCircle className="w-3 h-3" /> Débloquer
                                                    </button>
                                                )}

                                                {/* Edit */}
                                                {onEditJob && !isLoading && (
                                                    <button
                                                        onClick={() => onEditJob(job)}
                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Modifier la tâche"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                )}

                                                {/* Delete */}
                                                {!isLoading && (
                                                    <button
                                                        onClick={() => handleDelete(job)}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Supprimer la tâche"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
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

                {sortedJobs.length === 0 && (
                    <div className="py-12 text-center text-slate-400 text-sm">
                        Aucune tâche dans cette instance de planning.
                    </div>
                )}
            </div>

            {/* MANUAL_ACTION Confirmation Modal */}
            {confirmJob && (
                <ConfirmNoteModal
                    jobName={confirmJob.customTaskName || confirmJob.job?.name || 'Tâche'}
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

