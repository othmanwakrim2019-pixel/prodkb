import { Clock, Trash2, Edit2 } from 'lucide-react';
import type { OperationalTask } from '../api/equipe.service';
import {
    TASK_TYPE_LABELS,
    TASK_STATUS_LABELS,
    TASK_STATUS_BADGE,
    TASK_PRIORITY_BORDER,
    TASK_PRIORITY_DOT,
} from './equipe.constants';

interface TaskCardProps {
    task:            OperationalTask;
    onUpdateStatus?: (task: OperationalTask) => void;
    onEdit?:         (task: OperationalTask) => void;
    onDelete?:       (task: OperationalTask) => void;
    showAssignee?:   boolean;
}

export function TaskCard({ task, onUpdateStatus, onEdit, onDelete, showAssignee = false }: TaskCardProps) {
    const priorityBorder = TASK_PRIORITY_BORDER[task.priority];
    const statusBadge    = TASK_STATUS_BADGE[task.status];

    const formatTime = (iso: string | null) =>
        iso ? new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : null;

    const startT = formatTime(task.startTime);
    const endT   = formatTime(task.endTime);

    return (
        <div className={`ent-card p-3 border-l-4 ${priorityBorder} flex flex-col gap-2`}>
            {/* Header */}
            <div className="flex items-center gap-2 flex-wrap">
                <span title={task.priority}>{TASK_PRIORITY_DOT[task.priority]}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                    {TASK_TYPE_LABELS[task.taskType]}
                </span>
                <span className={`ml-auto inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${statusBadge}`}>
                    {TASK_STATUS_LABELS[task.status]}
                </span>
            </div>

            {/* Title */}
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug">
                {task.title}
            </p>

            {/* Meta badges */}
            <div className="flex flex-wrap gap-1.5 text-[11px]">
                {task.system && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        🖥️ {task.system.name}
                    </span>
                )}
                {task.chainLabel && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        ⛓️ {task.chainLabel}
                    </span>
                )}
                {showAssignee && (
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        👤 {task.assignedTo.name}
                    </span>
                )}
                {(startT || endT) && (
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <Clock size={10} /> {startT}{endT ? ` → ${endT}` : ''}
                    </span>
                )}
            </div>

            {/* Blocked / done note */}
            {task.note && task.status === 'BLOCKED' && (
                <p className="text-xs px-2 py-1 rounded bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
                    ⚠️ {task.note}
                </p>
            )}
            {task.note && task.status === 'DONE' && (
                <p className="text-xs px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">
                    ✅ {task.note}
                </p>
            )}

            {/* Actions */}
            {(onUpdateStatus || onEdit || onDelete) && (
                <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                    {onUpdateStatus && task.status !== 'DONE' && (
                        <button
                            className="ent-btn-secondary text-xs px-2 py-1"
                            onClick={() => onUpdateStatus(task)}
                        >
                            Mettre à jour
                        </button>
                    )}
                    <div className="ml-auto flex gap-1">
                        {onEdit && (
                            <button
                                className="p-1.5 text-slate-400 hover:text-primary dark:hover:text-blue-400 rounded transition-colors"
                                onClick={() => onEdit(task)}
                                title="Modifier"
                            >
                                <Edit2 size={13} />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                                onClick={() => onDelete(task)}
                                title="Supprimer"
                            >
                                <Trash2 size={13} />
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
