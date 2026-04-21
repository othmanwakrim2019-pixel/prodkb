import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2, Phone } from 'lucide-react';
import { astreinteService } from '../api/astreinte.service';
import type { Astreinte } from '../api/astreinte.service';
import { AssignAstreinteModal } from './AssignAstreinteModal';

interface Member { id: string; name: string; }
interface Team   { id: string; name: string; }

interface AstreintePlanningProps {
    astreintes: Astreinte[];
    teams:      Team[];
    members:    Member[];
    canManage:  boolean;
    year:       number;
    onYearChange: (y: number) => void;
    onRefresh:  () => void;
}

/** Build the 52 (or 53) ISO weeks for a given year */
function buildWeeks(year: number): { weekNumber: number; start: Date; end: Date }[] {
    const weeks: { weekNumber: number; start: Date; end: Date }[] = [];
    // Week 1: find the Monday on or before Jan 4 (ISO rule)
    const jan4 = new Date(year, 0, 4);
    const day  = jan4.getDay() || 7;
    const mon  = new Date(jan4);
    mon.setDate(jan4.getDate() - (day - 1));

    for (let w = 1; w <= 53; w++) {
        const start = new Date(mon);
        const end   = new Date(mon);
        end.setDate(mon.getDate() + 6);
        end.setHours(23, 59, 59, 999);

        // Stop once we reach week 1 of next year
        if (start.getFullYear() > year && w > 1) break;
        weeks.push({ weekNumber: w, start, end });
        mon.setDate(mon.getDate() + 7);
    }
    return weeks;
}

export function AstreintePlanning({
    astreintes, teams, members, canManage, year, onYearChange, onRefresh,
}: AstreintePlanningProps) {
    const [modal, setModal] = useState<{
        weekNumber: number; start: Date; end: Date; existing?: Astreinte;
    } | null>(null);

    const weeks = buildWeeks(year);
    const astrByWeek = astreintes.reduce<Record<number, Astreinte>>((acc, a) => {
        acc[a.weekNumber] = a;
        return acc;
    }, {});

    const todayWeek = (() => {
        const now    = new Date();
        const jan4   = new Date(now.getFullYear(), 0, 4);
        const day    = jan4.getDay() || 7;
        const mon    = new Date(jan4);
        mon.setDate(jan4.getDate() - (day - 1));
        const diff   = Math.floor((now.getTime() - mon.getTime()) / (7 * 86400000));
        return diff + 1;
    })();

    const handleDelete = async (a: Astreinte) => {
        if (!confirm(`Supprimer l'astreinte de ${a.user.name} (S${a.weekNumber}) ?`)) return;
        await astreinteService.delete(a.id);
        onRefresh();
    };

    const assigned   = astreintes.length;
    const total      = weeks.length;
    const coverage   = Math.round((assigned / total) * 100);

    return (
        <div className="space-y-4">
            {/* Year navigation + coverage */}
            <div className="flex items-center gap-3 flex-wrap">
                <button
                    className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => onYearChange(year - 1)}
                >
                    <ChevronLeft size={18} />
                </button>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                    Planning Astreinte {year}
                </h3>
                <button
                    className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => onYearChange(year + 1)}
                >
                    <ChevronRight size={18} />
                </button>
                <span className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-full ${
                    coverage === 100
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                }`}>
                    {assigned}/{total} semaines — {coverage}% {coverage < 100 ? '⚠️' : '✓'}
                </span>
            </div>

            {/* Week list */}
            <div className="ent-card overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {weeks.map(({ weekNumber, start, end }) => {
                    const existing   = astrByWeek[weekNumber];
                    const isThisWeek = weekNumber === todayWeek && year === new Date().getFullYear();
                    const startLabel = start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                    const endLabel   = end.toLocaleDateString('fr-FR',   { day: 'numeric', month: 'short' });

                    return (
                        <div
                            key={weekNumber}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm ${
                                isThisWeek
                                    ? 'bg-primary/5 dark:bg-primary/10'
                                    : ''
                            }`}
                        >
                            {/* Week number + dates */}
                            <div className="flex items-center gap-2 min-w-[180px]">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold uppercase ${
                                    isThisWeek
                                        ? 'bg-primary text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}>
                                    S{String(weekNumber).padStart(2, '0')}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {startLabel} → {endLabel}
                                </span>
                                {isThisWeek && (
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-primary">
                                        Cette semaine
                                    </span>
                                )}
                            </div>

                            {/* Person / status */}
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                {existing ? (
                                    <>
                                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400 text-xs font-bold shrink-0">
                                            {existing.user.name.charAt(0)}
                                        </span>
                                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{existing.user.name}</span>
                                        {existing.phone && (
                                            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                <Phone size={10} /> {existing.phone}
                                            </span>
                                        )}
                                        <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                                            ✓ Assigné
                                        </span>
                                    </>
                                ) : (
                                    <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                                        ⚠ Non assigné
                                    </span>
                                )}
                            </div>

                            {/* Actions */}
                            {canManage && (
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        className="p-1.5 text-slate-400 hover:text-primary dark:hover:text-blue-400 rounded transition-colors"
                                        title={existing ? 'Modifier' : 'Assigner'}
                                        onClick={() => setModal({ weekNumber, start, end, existing })}
                                    >
                                        {existing ? <Edit2 size={13} /> : <Plus size={13} />}
                                    </button>
                                    {existing && (
                                        <button
                                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                                            title="Supprimer"
                                            onClick={() => handleDelete(existing)}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {modal && (
                <AssignAstreinteModal
                    weekNumber={modal.weekNumber}
                    year={year}
                    startDate={modal.start}
                    endDate={modal.end}
                    teams={teams}
                    members={members}
                    existing={modal.existing}
                    onClose={() => setModal(null)}
                    onSaved={() => { setModal(null); onRefresh(); }}
                />
            )}
        </div>
    );
}
