import { useEffect, useState } from 'react';
import { Phone, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { astreinteService } from '../api/astreinte.service';
import type { Astreinte } from '../api/astreinte.service';

interface AstreinteWidgetProps {
    teamId?: string;
    compact?: boolean;
}

export function AstreinteWidget({ teamId, compact = false }: AstreinteWidgetProps) {
    const [astreinte, setAstreinte] = useState<Astreinte | null | undefined>(undefined);

    useEffect(() => {
        astreinteService.getCurrent(teamId).then(setAstreinte).catch(() => setAstreinte(null));
    }, [teamId]);

    if (astreinte === undefined) return null; // loading

    const endDate = astreinte ? new Date(astreinte.endDate) : null;
    const endLabel = endDate
        ? endDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })
        : null;

    if (compact) {
        return (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Phone size={14} className="text-primary shrink-0" />
                {astreinte
                    ? <span><strong className="text-slate-800 dark:text-slate-200">Astreinte :</strong> {astreinte.user.name}</span>
                    : <span className="italic">Aucune astreinte assignée</span>
                }
            </div>
        );
    }

    return (
        <div className={`ent-card p-4 ${!astreinte ? 'border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10' : 'border-primary/20 bg-primary/5 dark:bg-primary/10'}`}>
            {/* Header */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                <Phone size={13} className="text-primary" />
                <span>Astreinte — Semaine {astreinte?.weekNumber ?? '?'} / {astreinte?.year ?? new Date().getFullYear()}</span>
            </div>

            {astreinte ? (
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400 text-sm font-bold shrink-0">
                            {astreinte.user.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{astreinte.user.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{astreinte.team.name}</p>
                        </div>
                        {astreinte.phone && (
                            <a
                                href={`tel:${astreinte.phone}`}
                                className="ml-auto flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                            >
                                <Phone size={12} /> {astreinte.phone}
                            </a>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <Clock size={11} />
                        <span>Fin : {endLabel}</span>
                        {astreinte.notes && (
                            <span className="ml-2 italic truncate text-slate-400">{astreinte.notes}</span>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>Aucune astreinte assignée cette semaine</span>
                    <a href="/equipe?tab=astreintes" className="ml-auto flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                        Assigner <ChevronRight size={11} />
                    </a>
                </div>
            )}
        </div>
    );
}
