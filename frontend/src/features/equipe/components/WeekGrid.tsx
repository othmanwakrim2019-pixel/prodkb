import { TASK_STATUS_LABELS, TASK_STATUS_BADGE, TASK_TYPE_LABELS, TASK_PRIORITY_DOT } from './equipe.constants';
import type { DailyPlan, OperationalTask } from '../api/equipe.service';

interface Member { id: string; name: string; }

interface WeekGridProps {
    weekPlans:   DailyPlan[];
    weekStart:   Date;             // Always provided — drives the 7-day columns
    members:     Member[];
    onCellClick: (date: Date, member: Member) => void;
}

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

/** Build 7 dates Mon→Sun starting from a Monday */
function buildWeekDates(weekStart: Date): Date[] {
    // Normalise to Monday
    const d   = new Date(weekStart);
    const dow = d.getDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
        const day = new Date(d);
        day.setDate(d.getDate() + i);
        return day;
    });
}

function getTasksForCell(plans: DailyPlan[], date: Date, memberId: string): OperationalTask[] {
    const dateStr = date.toISOString().split('T')[0];
    const plan    = plans.find((p) => p.date.startsWith(dateStr));
    if (!plan) return [];
    return plan.tasks.filter((t) => t.assignedToId === memberId);
}

function CellTasks({ tasks, isWeekend }: { tasks: OperationalTask[]; isWeekend: boolean }) {
    if (tasks.length === 0) {
        return (
            <span className={`text-xs ${isWeekend ? 'text-slate-200 dark:text-slate-700' : 'text-slate-300 dark:text-slate-600'}`}>
                —
            </span>
        );
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
                    <span className="truncate">{TASK_TYPE_LABELS[t.taskType].split(' ')[0]}</span>
                    <span className="ml-auto font-medium shrink-0">{TASK_STATUS_LABELS[t.status]}</span>
                </div>
            ))}
        </div>
    );
}

export function WeekGrid({ weekPlans, weekStart, members, onCellClick }: WeekGridProps) {
    const weekDates = buildWeekDates(weekStart);
    const today     = new Date().toISOString().split('T')[0];

    if (members.length === 0) {
        return (
            <div className="ent-card p-8 text-center text-sm text-slate-400 dark:text-slate-500 italic">
                Aucun membre dans cette équipe.
            </div>
        );
    }

    return (
        <div className="ent-card overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-900">
                    <tr>
                        <th className="ent-th w-32 text-left sticky left-0 bg-slate-50 dark:bg-slate-900 z-10">Membre</th>
                        {weekDates.map((d, i) => {
                            const isToday   = d.toISOString().startsWith(today);
                            const isWeekend = i >= 5;
                            return (
                                <th
                                    key={i}
                                    className={`ent-th text-center min-w-[110px] ${
                                        isToday
                                            ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400'
                                            : isWeekend
                                                ? 'bg-slate-100/80 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500'
                                                : ''
                                    }`}
                                >
                                    <div className="font-semibold">{DAYS_FR[i]}</div>
                                    <div className="text-[10px] font-normal mt-0.5">
                                        {d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                    </div>
                                    {isWeekend && (
                                        <div className="text-[9px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-600 mt-0.5">
                                            WE
                                        </div>
                                    )}
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                    {members.map((member) => (
                        <tr key={member.id} className="ent-tr">
                            <td className="ent-td whitespace-nowrap sticky left-0 bg-white dark:bg-slate-900 z-10">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400 text-xs font-bold shrink-0">
                                        {member.name.charAt(0).toUpperCase()}
                                    </span>
                                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{member.name}</span>
                                </div>
                            </td>
                            {weekDates.map((d, i) => {
                                const tasks     = getTasksForCell(weekPlans, d, member.id);
                                const isToday   = d.toISOString().startsWith(today);
                                const isWeekend = i >= 5;
                                return (
                                    <td
                                        key={i}
                                        className={`ent-td align-top min-w-[110px] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                                            isToday
                                                ? 'bg-primary/5 dark:bg-primary/10'
                                                : isWeekend
                                                    ? 'bg-slate-50/70 dark:bg-slate-800/30'
                                                    : ''
                                        }`}
                                        onClick={() => onCellClick(d, member)}
                                        title={isWeekend ? 'Weekend — cliquer pour assigner' : 'Cliquer pour assigner une tâche'}
                                    >
                                        <CellTasks tasks={tasks} isWeekend={isWeekend} />
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
