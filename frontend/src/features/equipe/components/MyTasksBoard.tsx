import { useState } from 'react';
import type { OperationalTask } from '../api/equipe.service';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from './equipe.constants';
import { TaskCard } from './TaskCard';
import { UpdateStatusModal } from './UpdateStatusModal';
import { AstreinteWidget } from './AstreinteWidget';

interface MyTasksBoardProps {
    tasks:     OperationalTask[];
    teamId?:   string;
    onRefresh: () => void;
}

const STATUS_ORDER: OperationalTask['status'][] = ['BLOCKED', 'IN_PROGRESS', 'TODO', 'DONE'];

export function MyTasksBoard({ tasks, teamId, onRefresh }: MyTasksBoardProps) {
    const [statusModal, setStatusModal] = useState<OperationalTask | null>(null);
    const [showDone,    setShowDone]    = useState(false);

    const grouped = STATUS_ORDER.reduce<Record<string, OperationalTask[]>>((acc, s) => {
        acc[s] = tasks.filter((t) => t.status === s);
        return acc;
    }, {});

    const activeTasks = tasks.filter((t) => t.status !== 'DONE');
    const doneTasks   = grouped['DONE'];

    return (
        <div className="space-y-4">
            {/* Astreinte info banner */}
            <AstreinteWidget teamId={teamId} />

            {/* Summary header */}
            <div className="grid grid-cols-3 gap-3">
                {STATUS_ORDER.filter((s) => s !== 'DONE').map((s) => (
                    <div
                        key={s}
                        className="ent-card p-3 flex flex-col items-center gap-1 border-t-2"
                        style={{ borderTopColor: TASK_STATUS_COLORS[s] }}
                    >
                        <span className="text-xl font-bold" style={{ color: TASK_STATUS_COLORS[s] }}>
                            {grouped[s].length}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            {TASK_STATUS_LABELS[s]}
                        </span>
                    </div>
                ))}
            </div>

            {activeTasks.length === 0 && doneTasks.length === 0 && (
                <div className="ent-card p-10 flex flex-col items-center gap-3 text-center">
                    <span className="text-4xl">🎉</span>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Aucune tâche assignée pour aujourd'hui.</p>
                </div>
            )}

            {/* Active tasks grouped by status */}
            {STATUS_ORDER.filter((s) => s !== 'DONE').map((status) => {
                const group = grouped[status];
                if (group.length === 0) return null;
                return (
                    <section key={status} className="space-y-2">
                        <div
                            className="flex items-center gap-2 pb-1 border-b-2"
                            style={{ borderBottomColor: TASK_STATUS_COLORS[status] }}
                        >
                            <h3 className="text-sm font-semibold" style={{ color: TASK_STATUS_COLORS[status] }}>
                                {TASK_STATUS_LABELS[status]}
                            </h3>
                            <span className="ml-auto inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: TASK_STATUS_COLORS[status] }}>
                                {group.length}
                            </span>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {group.map((task) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    onUpdateStatus={(t) => setStatusModal(t)}
                                />
                            ))}
                        </div>
                    </section>
                );
            })}

            {/* Done tasks (collapsible) */}
            {doneTasks.length > 0 && (
                <section className="space-y-2">
                    <button
                        className="w-full flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-700"
                        onClick={() => setShowDone((v) => !v)}
                    >
                        <h3 className="text-sm font-semibold" style={{ color: TASK_STATUS_COLORS['DONE'] }}>
                            {TASK_STATUS_LABELS['DONE']}
                        </h3>
                        <span className="ml-auto inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: TASK_STATUS_COLORS['DONE'] }}>
                            {doneTasks.length}
                        </span>
                        <span className="text-slate-400 text-xs">{showDone ? '▲' : '▼'}</span>
                    </button>
                    {showDone && (
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {doneTasks.map((task) => (
                                <TaskCard key={task.id} task={task} />
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* Status update modal */}
            {statusModal && (
                <UpdateStatusModal
                    task={statusModal}
                    onClose={() => setStatusModal(null)}
                    onSaved={() => { setStatusModal(null); onRefresh(); }}
                />
            )}
        </div>
    );
}
