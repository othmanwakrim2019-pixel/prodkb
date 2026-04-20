import { type TaskPriority, type TaskStatus, type TaskType } from '../api/equipe.service';

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
    MEP:              '🚀 MEP',
    SUPERVISION:      '👁️ Supervision',
    TABLEAU_BORD:     '📊 Tableau de bord',
    REPRISE_INCIDENT: '🔁 Reprise d\'incident',
    CONTROLE_CHAINE:  '⛓️ Contrôle chaîne',
    RAPPORT:          '📝 Rapport',
    CUSTOM:           '📋 Tâche',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
    TODO:        'À faire',
    IN_PROGRESS: 'En cours',
    DONE:        'Terminé',
    BLOCKED:     'Bloqué',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
    LOW:      'Basse',
    NORMAL:   'Normale',
    HIGH:     'Haute',
    CRITICAL: 'Critique',
};

/** Tailwind badge classes per status */
export const TASK_STATUS_BADGE: Record<TaskStatus, string> = {
    TODO:        'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    DONE:        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    BLOCKED:     'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

/** Tailwind left-border accent classes per priority */
export const TASK_PRIORITY_BORDER: Record<TaskPriority, string> = {
    LOW:      'border-l-slate-400',
    NORMAL:   'border-l-blue-500',
    HIGH:     'border-l-amber-500',
    CRITICAL: 'border-l-red-600',
};

export const TASK_PRIORITY_DOT: Record<TaskPriority, string> = {
    LOW:      '🟢',
    NORMAL:   '🔵',
    HIGH:     '🟡',
    CRITICAL: '🔴',
};
