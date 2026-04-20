import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { DailyPlan, OperationalTask } from '../api/equipe.service';
import { equipeService } from '../api/equipe.service';
import { TaskCard } from './TaskCard';
import { AssignTaskModal } from './AssignTaskModal';
import { UpdateStatusModal } from './UpdateStatusModal';

interface Member { id: string; name: string; email: string; }
interface System { id: string; name: string; }

interface DailyBoardProps {
    plan:         DailyPlan | null;
    members:      Member[];
    systems:      System[];
    canManage:    boolean;
    onPlanChange: () => void;
}

export function DailyBoard({ plan, members, systems, canManage, onPlanChange }: DailyBoardProps) {
    const [assignModal, setAssignModal] = useState<{ open: boolean; preAssignedTo?: string }>({ open: false });
    const [statusModal, setStatusModal] = useState<OperationalTask | null>(null);

    const handleDeleteTask = async (task: OperationalTask) => {
        if (!confirm(`Supprimer la tâche "${task.title}" ?`)) return;
        await equipeService.deleteTask(task.id);
        onPlanChange();
    };

    if (!plan) {
        return (
            <div className="ent-card p-10 flex flex-col items-center gap-4 text-center">
                <p className="text-slate-400 dark:text-slate-500 text-sm italic">
                    Aucun plan pour ce jour.
                </p>
                {canManage && (
                    <button className="ent-btn-primary" onClick={() => setAssignModal({ open: true })}>
                        <Plus className="h-4 w-4" /> Créer le plan du jour
                    </button>
                )}
            </div>
        );
    }

    // Group tasks by assigned member
    const byUser = members.reduce<Record<string, OperationalTask[]>>((acc, m) => {
        acc[m.id] = plan.tasks.filter((t) => t.assignedToId === m.id);
        return acc;
    }, {});

    // Extra users (tasks for members not in the list)
    const assignedIds = new Set(plan.tasks.map((t) => t.assignedToId));
    const extraUsers  = [...assignedIds].filter((id) => !members.find((m) => m.id === id));

    const allColumns = [
        ...members.map((m) => ({ id: m.id, name: m.name, tasks: byUser[m.id] ?? [] })),
        ...extraUsers.map((id) => {
            const tasks = plan.tasks.filter((t) => t.assignedToId === id);
            return { id, name: tasks[0]?.assignedTo.name ?? 'Inconnu', tasks };
        }),
    ];

    return (
        <div className="flex flex-col gap-4">
            {/* Columns grid */}
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(allColumns.length, 4)}, minmax(220px, 1fr))` }}>
                {allColumns.map((col) => (
                    <div key={col.id} className="ent-card flex flex-col gap-3 p-4 min-h-[200px]">
                        {/* Column header */}
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400 text-xs font-bold flex-shrink-0">
                                {col.name.charAt(0).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{col.name}</p>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                    {col.tasks.length} tâche{col.tasks.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>

                        {/* Tasks */}
                        <div className="flex flex-col gap-2 flex-1">
                            {col.tasks.length === 0 && (
                                <p className="text-xs text-slate-300 dark:text-slate-600 italic text-center py-4">
                                    Aucune tâche assignée
                                </p>
                            )}
                            {col.tasks.map((task) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    onUpdateStatus={!canManage ? (t) => setStatusModal(t) : undefined}
                                    onDelete={canManage ? (t) => handleDeleteTask(t) : undefined}
                                />
                            ))}
                        </div>

                        {/* Add task (manager only) */}
                        {canManage && (
                            <button
                                className="mt-auto w-full flex items-center justify-center gap-1.5 py-2 text-xs text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-blue-400 border border-dashed border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-blue-500 rounded transition-colors"
                                onClick={() => setAssignModal({ open: true, preAssignedTo: col.id })}
                            >
                                <Plus size={13} /> Ajouter une tâche
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Modals */}
            {assignModal.open && (
                <AssignTaskModal
                    planId={plan.id}
                    members={members}
                    systems={systems}
                    preAssignedTo={assignModal.preAssignedTo}
                    onClose={() => setAssignModal({ open: false })}
                    onSaved={onPlanChange}
                />
            )}
            {statusModal && (
                <UpdateStatusModal
                    task={statusModal}
                    onClose={() => setStatusModal(null)}
                    onSaved={onPlanChange}
                />
            )}
        </div>
    );
}
