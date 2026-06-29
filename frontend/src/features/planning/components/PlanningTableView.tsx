import { useState } from 'react';
import {
    AlertCircle,
    AlertTriangle,
    Ban,
    CheckCircle,
    Clock,
    Cpu,
    Pencil,
    Play,
    Trash2,
    User,
    XCircle,
} from 'lucide-react';
import type { PlanningJob, PlanningStatusType } from '../../../types/planning';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import { planningService } from '../api/planning.service';

interface Props {
    jobs: PlanningJob[];
    instanceStatus: 'active' | 'archived';
    onRefresh: () => void;
    onCreateIncident?: (job: PlanningJob) => void;
    onEditJob?: (job: PlanningJob) => void;
}

interface ConfirmNoteModalProps {
    jobName: string;
    onConfirm: (note: string) => void;
    onCancel: () => void;
}

const STATUS_CONFIG: Record<PlanningStatusType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    pending: { label: 'En attente', color: 'text-slate-600', bg: 'bg-slate-100', icon: <Clock className="h-3.5 w-3.5" /> },
    running: { label: 'En cours', color: 'text-blue-700', bg: 'bg-blue-100', icon: <Play className="h-3.5 w-3.5 animate-pulse" /> },
    done: { label: 'Termine', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: <CheckCircle className="h-3.5 w-3.5" /> },
    failed: { label: 'Echoue', color: 'text-red-700', bg: 'bg-red-100', icon: <XCircle className="h-3.5 w-3.5" /> },
    blocked: { label: 'Bloque', color: 'text-amber-700', bg: 'bg-amber-100', icon: <Ban className="h-3.5 w-3.5" /> },
};

const ConfirmNoteModal = ({ jobName, onConfirm, onCancel }: ConfirmNoteModalProps) => {
    const [note, setNote] = useState('');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <h3 className="mb-1 font-semibold text-slate-800">Confirmer la tache terminee</h3>
                <p className="mb-4 text-sm text-slate-500">
                    <span className="font-medium text-slate-700">{jobName}</span>
                    <br />
                    Veuillez confirmer avec une note de cloture.
                </p>
                <textarea
                    autoFocus
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    className="h-24 w-full resize-none rounded-lg border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder='ex. "Toutes les agences fermees a 18h30"'
                />
                <div className="mt-4 flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={() => onConfirm(note)}
                        disabled={!note.trim()}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                    >
                        Confirmer
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
    const { confirm } = useConfirm();

    const sortedJobs = [...jobs].sort(
        (left, right) => new Date(left.scheduledTime).getTime() - new Date(right.scheduledTime).getTime()
    );

    const clearErrorSoon = () => {
        setTimeout(() => setError(null), 5000);
    };

    const updateStatus = async (job: PlanningJob, newStatus: PlanningStatusType, notes?: string) => {
        setLoadingId(job.id);
        setError(null);

        try {
            await planningService.updateJobStatus(job.id, newStatus, notes);
            onRefresh();
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                'Impossible de mettre a jour le statut.';
            setError(message);
            clearErrorSoon();
        } finally {
            setLoadingId(null);
        }
    };

    const handleDelete = async (job: PlanningJob) => {
        const taskLabel = job.customTaskName || job.job?.name || 'cette tache';
        const shouldDelete = await confirm(
            `Supprimer "${taskLabel}" ?`,
            'Cette action est irreversible.',
            'danger'
        );

        if (!shouldDelete) {
            return;
        }

        setLoadingId(job.id);

        try {
            await planningService.deleteJob(job.id);
            onRefresh();
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                'Impossible de supprimer la tache.';
            setError(message);
            clearErrorSoon();
        } finally {
            setLoadingId(null);
        }
    };

    const handleMarkDone = (job: PlanningJob) => {
        if (job.taskType === 'MANUAL_ACTION') {
            setConfirmJob(job);
            return;
        }

        void updateStatus(job, 'done');
    };

    const totalDone = jobs.filter((job) => job.status === 'done').length;
    const progress = jobs.length > 0 ? Math.round((totalDone / jobs.length) * 100) : 0;
    const isEditable = instanceStatus === 'active';

    return (
        <div className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 px-4 py-3">
                <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">
                        {totalDone} / {jobs.length} taches terminees
                    </span>
                    <span className="text-sm font-bold text-slate-700">{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {error && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">#</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date / Heure</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Type</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tache</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Responsable</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Statut</th>
                            {isEditable && (
                                <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                        {sortedJobs.map((job, index) => {
                            const statusConfig = STATUS_CONFIG[job.status];
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
                                    className={`transition-none ${
                                        isDone
                                            ? 'bg-emerald-50/30'
                                            : isFailed
                                                ? 'bg-red-50/30'
                                                : isRunning
                                                    ? 'bg-blue-50/30'
                                                    : isBlocked
                                                        ? 'bg-amber-50/20 opacity-70'
                                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                    }`}
                                >
                                    <td className="px-4 py-2 font-mono text-xs text-slate-400 whitespace-nowrap">{index + 1}</td>

                                    <td className="px-4 py-2 whitespace-nowrap">
                                        <div className="text-xs font-medium text-slate-700">
                                            {new Date(job.scheduledTime).toLocaleDateString('fr-FR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                            })}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {new Date(job.scheduledTime).toLocaleTimeString('fr-FR', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                            {' - '}
                                            {new Date(job.scheduledTime).toLocaleDateString('fr-FR', { weekday: 'short' })}
                                        </div>
                                    </td>

                                    <td className="px-4 py-2 whitespace-nowrap">
                                        <span title={isBatch ? 'Traitement automatique (Batch)' : 'Action manuelle'}>
                                            {isBatch ? (
                                                <Cpu className="h-4 w-4 text-blue-400" />
                                            ) : (
                                                <User className="h-4 w-4 text-violet-400" />
                                            )}
                                        </span>
                                    </td>

                                    <td className="px-4 py-2">
                                        <div className={`font-medium ${isDone ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                            {job.customTaskName || job.job?.name || 'Sans titre'}
                                        </div>
                                        <div className="mt-0.5 text-xs text-slate-400">
                                            {job.system?.name || (job.customTaskName ? 'Action manuelle' : '')}
                                        </div>
                                        {job.notes && <div className="mt-1 text-xs italic text-emerald-600">"{job.notes}"</div>}
                                        {isRunning && job.launchedAt && (
                                            <div className="mt-0.5 text-xs text-blue-500">
                                                Demarre a{' '}
                                                {new Date(job.launchedAt).toLocaleTimeString('fr-FR', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                                {job.launchedBy ? ` par ${job.launchedBy.name}` : ''}
                                            </div>
                                        )}
                                        {isDone && job.completedAt && (
                                            <div className="mt-0.5 text-xs text-emerald-600">
                                                Termine a{' '}
                                                {new Date(job.completedAt).toLocaleTimeString('fr-FR', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                                {job.completedBy ? ` par ${job.completedBy.name}` : ''}
                                            </div>
                                        )}
                                        {job.dependencies.length > 0 && (
                                            <div className="mt-0.5 text-xs text-slate-300">
                                                Dependances: {job.dependencies.length}
                                            </div>
                                        )}
                                    </td>

                                    <td className="px-4 py-3">
                                        {job.supportContact ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-xs text-violet-600">
                                                <User className="h-3 w-3" /> {job.supportContact}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-300">-</span>
                                        )}
                                    </td>

                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                                            {statusConfig.icon}
                                            {statusConfig.label}
                                        </span>
                                    </td>

                                    {isEditable && (
                                        <td className="px-4 py-2 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {isLoading && (
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600" />
                                                )}

                                                {isPending && !isLoading && (
                                                    <button
                                                        onClick={() => void updateStatus(job, 'running')}
                                                        className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                                                        title="Demarrer"
                                                    >
                                                        <Play className="h-3 w-3" /> Demarrer
                                                    </button>
                                                )}

                                                {isRunning && !isLoading && (
                                                    <button
                                                        onClick={() => handleMarkDone(job)}
                                                        className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                                                        title="Marquer termine"
                                                    >
                                                        <CheckCircle className="h-3 w-3" /> Termine
                                                    </button>
                                                )}

                                                {(isPending || isRunning || isBlocked) && !isLoading && (
                                                    <button
                                                        onClick={() => void updateStatus(job, 'failed')}
                                                        className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
                                                        title="Marquer echoue"
                                                    >
                                                        <XCircle className="h-3 w-3" /> Echoue
                                                    </button>
                                                )}

                                                {isFailed && onCreateIncident && !isLoading && (
                                                    <button
                                                        onClick={() => onCreateIncident(job)}
                                                        className="flex items-center gap-1 rounded-lg bg-orange-50 px-2.5 py-1.5 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-100"
                                                        title="Creer un incident"
                                                    >
                                                        <AlertTriangle className="h-3 w-3" /> Incident
                                                    </button>
                                                )}

                                                {(isDone || isFailed) && !isLoading && (
                                                    <button
                                                        onClick={() => void updateStatus(job, 'pending')}
                                                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                                                        title="Reouvrir"
                                                    >
                                                        <AlertCircle className="h-3.5 w-3.5" />
                                                    </button>
                                                )}

                                                {isBlocked && !isLoading && (
                                                    <button
                                                        onClick={() => void updateStatus(job, 'pending')}
                                                        className="flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100"
                                                    >
                                                        <AlertCircle className="h-3 w-3" /> Debloquer
                                                    </button>
                                                )}

                                                {onEditJob && !isLoading && (
                                                    <button
                                                        onClick={() => onEditJob(job)}
                                                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                                                        title="Modifier la tache"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                )}

                                                {!isLoading && (
                                                    <button
                                                        onClick={() => void handleDelete(job)}
                                                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                                        title="Supprimer la tache"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
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
                    <div className="py-12 text-center text-sm text-slate-400">
                        Aucune tache dans cette instance de planning.
                    </div>
                )}
            </div>

            {confirmJob && (
                <ConfirmNoteModal
                    jobName={confirmJob.customTaskName || confirmJob.job?.name || 'Tache'}
                    onConfirm={(note) => {
                        void updateStatus(confirmJob, 'done', note);
                        setConfirmJob(null);
                    }}
                    onCancel={() => setConfirmJob(null)}
                />
            )}
        </div>
    );
};
