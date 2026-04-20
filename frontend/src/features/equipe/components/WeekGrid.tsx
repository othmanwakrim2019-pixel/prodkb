import { TASK_STATUS_LABELS, TASK_STATUS_BADGE, TASK_TYPE_LABELS, TASK_PRIORITY_DOT } from './equipe.constants';
import type { DailyPlan, OperationalTask } from '../api/equipe.service';

interface Member { id: string; name: string; }

interface WeekGridProps {
    weekPlans:   DailyPlan[];
    members:     Member[];
    onCellClick: (date: Date, member: Member) => void;
}

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function getWeekDates(plans: DailyPlan[]): Date[] {
    if (plans.length === 0) return [];
    const sorted   = [...plans].sort((a, b) => a.date.localeCompare(b.date));
    const first    = new Date(sorted[0].date);
    const dayOfWeek = first.getDay();
    const monday   = new Date(first);
    monday.setDate(first.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
    });
}

function getTasksForCell(plans: DailyPlan[], date: Date, memberId: string): OperationalTask[] {
    const dateStr = date.toISOString().split('T')[0];
    const plan    = plans.find((p) => p.date.startsWith(dateStr));
    if (!plan) return [];
    return plan.tasks.filter((t) => t.assignedToId === memberId);
}

function CellTasks({ tasks }: { tasks: OperationalTask[] }) {
    if (tasks.length === 0) {
        return <span className="text-xs text-slate-300 dark:text-slate-600">—</span>;
    }
    return (
        <div className="flex flex-col gap-1">
            {tasks.map((t) => (
                <div
                    key={t.id}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded border-l-2 text-[10px] ${TASK_STATUS_BADGE[t.status]}`}
                    title={t.title}
                >
                    {TASK_PRIORITY_DOT[t.priority]}{' '}
                    {TASK_TYPE_LABELS[t.taskType].split(' ')[0]}
                    <span className="ml-auto font-medium">{TASK_STATUS_LABELS[t.status]}</span>
                </div>
            ))}
        </div>
    );
}

export function WeekGrid({ weekPlans, members, onCellClick }: WeekGridProps) {
    const weekDates = getWeekDates(weekPlans);
    const today     = new Date().toISOString().split('T')[0];

    if (weekDates.length === 0 || members.length === 0) {
        return (
            <div className="ent-card p-8 text-center text-sm text-slate-400 dark:text-slate-500 italic">
                Aucun plan cette semaine.
            </div>
        );
    }

    return (
        <div className="ent-card overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-900">
                    <tr>
                        <th className="ent-th w-32 text-left">Membre</th>
                        {weekDates.map((d, i) => {
                            const isToday = d.toISOString().startsWith(today);
                            return (
                                <th
                                    key={i}
                                    className={`ent-th text-center ${isToday ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400' : ''}`}
                                >
                                    <div className="font-semibold">{DAYS_FR[i]}</div>
                                    <div className="text-[10px] font-normal text-slate-400 dark:text-slate-500 mt-0.5">
                                        {d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                    {members.map((member) => (
                        <tr key={member.id} className="ent-tr">
                            <td className="ent-td whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400 text-xs font-bold">
                                        {member.name.charAt(0).toUpperCase()}
                                    </span>
                                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{member.name}</span>
                                </div>
                            </td>
                            {weekDates.map((d, i) => {
                                const tasks   = getTasksForCell(weekPlans, d, member.id);
                                const isToday = d.toISOString().startsWith(today);
                                return (
                                    <td
                                        key={i}
                                        className={`ent-td align-top min-w-[120px] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                                            isToday ? 'bg-primary/5 dark:bg-primary/10' : ''
                                        }`}
                                        onClick={() => onCellClick(d, member)}
                                        title="Cliquer pour assigner une tâche"
                                    >
                                        <CellTasks tasks={tasks} />
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
