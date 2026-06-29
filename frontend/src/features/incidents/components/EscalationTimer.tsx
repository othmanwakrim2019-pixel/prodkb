/**
 * EscalationTimer — shows current escalation level and countdown to next escalation
 * Reads escalationLevel from the incident and computes timing from the SLA rules.
 * Pure frontend — no new backend endpoints needed.
 */
import { useState, useEffect } from 'react';
import { TrendingUp, Clock, ShieldAlert, CheckCircle } from 'lucide-react';
import type { Incident } from '../../../types';

interface Props {
    incident: Incident;
}

const LEVEL_LABELS: Record<number, { label: string; color: string; bg: string }> = {
    0: { label: 'Not Escalated', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
    1: { label: 'Level 1 — Team Lead', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
    2: { label: 'Level 2 — Manager', color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' },
    3: { label: 'Level 3 — Director', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
};

function formatDuration(ms: number): string {
    if (ms <= 0) return 'Now';
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

export const EscalationTimer = ({ incident }: Props) => {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        // Only tick if incident is still active
        if (incident.status === 'Resolved' || incident.status === 'Closed') return;
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [incident.status]);

    const level = incident.escalationLevel ?? 0;
    const levelInfo = LEVEL_LABELS[Math.min(level, 3)];
    const isResolved = incident.status === 'Resolved' || incident.status === 'Closed';

    // Compute next escalation deadline
    // SLA responseTimeHours = total SLA time in hours
    // After SLA breach, escalation kicks in every ~30min (configurable in admin)
    // We approximate: each escalation level adds 30 min after the SLA breach point
    let nextEscalationMs: number | null = null;
    let prevEscalationAt: Date | null = null;

    const createdAt = new Date(incident.createdAt);
    const slaHours = incident.sla?.responseTimeHours ?? incident.sla?.resolutionTimeHours ?? null;

    if (slaHours && !isResolved) {
        // SLA breach point
        const breachAt = new Date(createdAt.getTime() + slaHours * 60 * 60 * 1000);

        if (level === 0) {
            // Not yet escalated — show time until SLA breach (which triggers L1)
            nextEscalationMs = breachAt.getTime() - now;
            prevEscalationAt = null;
        } else {
            // Already escalated — estimate next escalation in 30m intervals after breach
            const nextAt = new Date(breachAt.getTime() + level * 30 * 60 * 1000);
            nextEscalationMs = nextAt.getTime() - now;
            prevEscalationAt = new Date(breachAt.getTime() + (level - 1) * 30 * 60 * 1000);
        }
    }

    const isOverdue = nextEscalationMs !== null && nextEscalationMs <= 0;
    const isUrgent = nextEscalationMs !== null && nextEscalationMs > 0 && nextEscalationMs < 10 * 60 * 1000; // < 10 min

    return (
        <div className={`rounded border p-3 ${levelInfo.bg} space-y-2.5`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <TrendingUp className={`h-3.5 w-3.5 ${levelInfo.color}`} />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Escalation</span>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${levelInfo.color} ${levelInfo.bg}`}>
                    {levelInfo.label}
                </span>
            </div>

            {/* Level dots */}
            <div className="flex items-center gap-1">
                {[0, 1, 2, 3].map(l => (
                    <div
                        key={l}
                        className={`h-2 flex-1 rounded-full transition-all ${
                            l <= level
                                ? level === 0 ? 'bg-emerald-400 dark:bg-emerald-600'
                                    : level === 1 ? 'bg-amber-400 dark:bg-amber-600'
                                    : level === 2 ? 'bg-orange-400 dark:bg-orange-600'
                                    : 'bg-red-500 dark:bg-red-600'
                                : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                    />
                ))}
            </div>

            {/* Timer */}
            {isResolved ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Resolved — escalation stopped
                </div>
            ) : nextEscalationMs !== null ? (
                <div className="space-y-1">
                    {prevEscalationAt && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Escalated: {prevEscalationAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    )}
                    <div className={`flex items-center gap-1.5 text-xs font-semibold ${
                        isOverdue ? 'text-red-600 dark:text-red-400'
                        : isUrgent ? 'text-orange-600 dark:text-orange-400 animate-pulse'
                        : levelInfo.color
                    }`}>
                        <Clock className="h-3.5 w-3.5" />
                        {isOverdue
                            ? `Overdue — escalation triggered`
                            : `Next escalation in ${formatDuration(nextEscalationMs)}`
                        }
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    No SLA attached — escalation not tracked
                </div>
            )}
        </div>
    );
};
