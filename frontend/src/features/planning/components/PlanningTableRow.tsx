import {
    AlertCircle,
    AlertTriangle,
    CheckCircle,
    Cpu,
    Pencil,
    Play,
    Trash2,
    User,
    XCircle,
} from 'lucide-react';
import type { PlanningJob, PlanningStatusType } from '../model/planning';
import { STATUS_CONFIG } from '../constants/status-config';

interface PlanningTableRowProps {
    job: PlanningJob;
    index: number;
    isEditable: boolean;
    loadingId: string | null;
    onUpdateStatus: (job: PlanningJob, newStatus: PlanningStatusType) => void;
    onMarkDone: (job: PlanningJob) => void;
    onDelete: (job: PlanningJob) => void;
    onCreateIncident?: (job: PlanningJob) => void;
    onEditJob?: (job: PlanningJob) => void;
}

export const PlanningTableRow = ({
    job,
    index,
    isEditable,
    loadingId,
    onUpdateStatus,
    onMarkDone,
    onDelete,
    onCreateIncident,
    onEditJob,
}: PlanningTableRowProps) => {
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
                                onClick={() => onUpdateStatus(job, 'running')}
                                className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                                title="Demarrer"
                            >
                                <Play className="h-3 w-3" /> Demarrer
                            </button>
                        )}

                        {isRunning && !isLoading && (
                            <button
                                onClick={() => onMarkDone(job)}
                                className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                                title="Marquer termine"
                            >
                                <CheckCircle className="h-3 w-3" /> Termine
                            </button>
                        )}

                        {(isPending || isRunning || isBlocked) && !isLoading && (
                            <button
                                onClick={() => onUpdateStatus(job, 'failed')}
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
                                onClick={() => onUpdateStatus(job, 'pending')}
                                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                                title="Reouvrir"
                            >
                                <AlertCircle className="h-3.5 w-3.5" />
                            </button>
                        )}

                        {isBlocked && !isLoading && (
                            <button
                                onClick={() => onUpdateStatus(job, 'pending')}
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
                                onClick={() => onDelete(job)}
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
};
