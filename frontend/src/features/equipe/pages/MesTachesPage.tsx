import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, RefreshCw, Calendar, CheckCircle2 } from 'lucide-react';
import { equipeService } from '../api/equipe.service';
import type { OperationalTask } from '../api/equipe.service';
import { MyTasksBoard } from '../components/MyTasksBoard';
import { AstreinteWidget } from '../components/AstreinteWidget';
import { TaskCard } from '../components/TaskCard';
import { UpdateStatusModal } from '../components/UpdateStatusModal';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '../components/equipe.constants';
import { useToast } from '../../../components/ui/Toast';

type View = 'today' | 'week';

const DAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

/** Get the Monday of the current week */
function getWeekStart(): Date {
    const d = new Date();
    const dow = d.getDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

/** Group tasks by day-of-week (0 = Monday … 6 = Sunday) */
function groupByDay(tasks: OperationalTask[]): Map<string, OperationalTask[]> {
    const map = new Map<string, OperationalTask[]>();
    for (const task of tasks) {
        const dateKey = task.plan?.date
            ? task.plan.date.split('T')[0]
            : new Date().toISOString().split('T')[0];
        const existing = map.get(dateKey) ?? [];
        existing.push(task);
        map.set(dateKey, existing);
    }
    return map;
}

export default function MesTachesPage() {
    const toast = useToast();
    const [view,        setView]        = useState<View>('today');
    const [tasks,       setTasks]       = useState<OperationalTask[]>([]);
    const [loading,     setLoading]     = useState(false);
    const [statusModal, setStatusModal] = useState<OperationalTask | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = view === 'today'
                ? await equipeService.getMyTasksToday()
                : await equipeService.getMyTasksWeek();
            setTasks(data);
        } catch {
            toast.error('Impossible de charger vos tâches.');
        } finally {
            setLoading(false);
        }
    }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { load(); }, [load]);

    const today = new Date().toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    // ── Week view helpers ──────────────────────────────────────────
    const weekStart   = getWeekStart();
    const weekDates   = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
    });
    const tasksByDay  = groupByDay(tasks);
    const todayStr    = new Date().toISOString().split('T')[0];

    // ── Summary counts ─────────────────────────────────────────────
    const statusCounts = (['BLOCKED', 'IN_PROGRESS', 'TODO', 'DONE'] as OperationalTask['status'][])
        .map((s) => ({ status: s, count: tasks.filter((t) => t.status === s).length }));

    return (
        <div className="space-y-5">
            {/* ── Header ───────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400">
                        <ClipboardList size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Mes Tâches</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{today}</p>
                    </div>
                </div>
                <button
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
                    onClick={load}
                    title="Actualiser"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* ── Astreinte Banner ─────────────────────────────────── */}
            <AstreinteWidget />

            {/* ── Status Summary Pills ─────────────────────────────── */}
            {tasks.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                    {statusCounts.map(({ status, count }) => (
                        <div
                            key={status}
                            className="ent-card p-3 flex flex-col items-center gap-1 border-t-[3px]"
                            style={{ borderTopColor: TASK_STATUS_COLORS[status] }}
                        >
                            <span className="text-lg font-bold" style={{ color: TASK_STATUS_COLORS[status] }}>
                                {count}
                            </span>
                            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide text-center">
                                {TASK_STATUS_LABELS[status]}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* ── View Toggle ──────────────────────────────────────── */}
            <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
                <button
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                        view === 'today'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                    onClick={() => setView('today')}
                >
                    <CheckCircle2 size={14} /> Aujourd'hui
                </button>
                <button
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                        view === 'week'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                    onClick={() => setView('week')}
                >
                    <Calendar size={14} /> Cette semaine
                </button>
            </div>

            {/* ── Loading ──────────────────────────────────────────── */}
            {loading && (
                <div className="ent-card p-10 flex flex-col items-center gap-3">
                    <RefreshCw size={24} className="animate-spin text-primary/50" />
                    <p className="text-sm text-slate-400">Chargement de vos tâches...</p>
                </div>
            )}

            {/* ── TODAY view ───────────────────────────────────────── */}
            {!loading && view === 'today' && (
                <MyTasksBoard tasks={tasks} onRefresh={load} />
            )}

            {/* ── WEEK view ────────────────────────────────────────── */}
            {!loading && view === 'week' && (
                <div className="space-y-3">
                    {tasks.length === 0 && (
                        <div className="ent-card p-10 flex flex-col items-center gap-3 text-center">
                            <span className="text-4xl">🎉</span>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Aucune tâche cette semaine — profitez bien !</p>
                        </div>
                    )}

                    {weekDates.map((date, i) => {
                        const dateKey  = date.toISOString().split('T')[0];
                        const dayTasks = tasksByDay.get(dateKey) ?? [];
                        const isToday  = dateKey === todayStr;
                        const isWE     = i >= 5;

                        return (
                            <div
                                key={dateKey}
                                className={`ent-card overflow-hidden ${isToday ? 'ring-2 ring-primary/30 dark:ring-primary/20' : ''}`}
                            >
                                {/* Day header */}
                                <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 ${
                                    isToday
                                        ? 'bg-primary/5 dark:bg-primary/10'
                                        : isWE
                                            ? 'bg-slate-50 dark:bg-slate-800/50'
                                            : 'bg-white dark:bg-slate-900'
                                }`}>
                                    <span className={`inline-flex items-center justify-center h-7 w-7 rounded-lg text-xs font-bold ${
                                        isToday
                                            ? 'bg-primary text-white'
                                            : isWE
                                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                    }`}>
                                        {date.getDate()}
                                    </span>
                                    <div>
                                        <span className={`text-sm font-semibold ${isToday ? 'text-primary' : 'text-slate-800 dark:text-slate-200'}`}>
                                            {DAYS_FR[i]}
                                            {isToday && <span className="ml-2 text-[10px] font-bold uppercase tracking-wide bg-primary text-white px-1.5 py-0.5 rounded">Aujourd'hui</span>}
                                            {isWE   && <span className="ml-2 text-[10px] font-medium text-slate-400">Weekend</span>}
                                        </span>
                                        <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
                                            {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                                        </span>
                                    </div>
                                    <span className="ml-auto">
                                        {dayTasks.length === 0 ? (
                                            <span className="text-xs text-slate-400 dark:text-slate-500 italic">Aucune tâche</span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary dark:text-blue-400">
                                                {dayTasks.length} tâche{dayTasks.length > 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </span>
                                </div>

                                {/* Day tasks */}
                                {dayTasks.length > 0 && (
                                    <div className="p-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                        {dayTasks.map((task) => (
                                            <TaskCard
                                                key={task.id}
                                                task={task}
                                                onUpdateStatus={setStatusModal}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Status update modal */}
            {statusModal && (
                <UpdateStatusModal
                    task={statusModal}
                    onClose={() => setStatusModal(null)}
                    onSaved={() => { setStatusModal(null); load(); }}
                />
            )}
        </div>
    );
}
