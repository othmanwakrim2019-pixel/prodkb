/**
 * SLATimer — shows time remaining until SLA breach, or "Breached" if exceeded.
 * Compact variant for tables, full variant for incident sidebar.
 */
import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface Props {
    /** Incident creation time (ISO string) */
    createdAt: string;
    /** Incident acknowledgement time — if null, using acknowledge target */
    acknowledgedAt?: string | null;
    /** Incident resolution time — if set, incident is resolved */
    resolvedAt?: string | null;
    /** Current status */
    status: string;
    /** SLA object from the incident */
    sla?: {
        acknowledgeTimeMinutes: number;
        resolveTimeMinutes: number;
    } | null;
    /** Whether the SLA has already been flagged as breached in DB */
    slaBreached?: boolean;
    /** 'compact' shows just a small lozenge; 'full' shows a progress bar */
    variant?: 'compact' | 'full';
}

function formatRemaining(ms: number): string {
    if (ms <= 0) return 'Breached';
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function getColour(pct: number, breached: boolean) {
    if (breached || pct <= 0) return { bar: 'bg-red-600', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' };
    if (pct < 0.15) return { bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' };
    if (pct < 0.35) return { bar: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800' };
    if (pct < 0.60) return { bar: 'bg-yellow-500', text: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800' };
    return { bar: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800' };
}

export const SLATimer = ({ createdAt, acknowledgedAt, resolvedAt, status, sla, slaBreached = false, variant = 'compact' }: Props) => {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        // Only tick if not resolved/closed
        const resolved = ['Resolved', 'Closed'].includes(status);
        if (resolved) return;
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [status]);

    // No SLA — nothing to show
    if (!sla) return null;

    const isResolved = ['Resolved', 'Closed'].includes(status);
    const isAcknowledged = !!acknowledgedAt;

    // Pick target: if not acknowledged → use ack time; else → use resolve time
    const targetMinutes = isAcknowledged ? sla.resolveTimeMinutes : sla.acknowledgeTimeMinutes;
    const label = isAcknowledged ? 'Resolve by' : 'Ack by';
    const referenceMs = isAcknowledged
        ? new Date(acknowledgedAt!).getTime()
        : new Date(createdAt).getTime();

    const deadlineMs = referenceMs + targetMinutes * 60_000;
    const remainingMs = deadlineMs - (isResolved ? new Date(resolvedAt ?? createdAt).getTime() : now);
    const totalMs = targetMinutes * 60_000;
    const pct = Math.max(0, Math.min(1, remainingMs / totalMs));
    const breached = slaBreached || remainingMs <= 0;
    const colour = getColour(pct, breached);

    if (variant === 'compact') {
        return (
            <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${colour.bg} ${colour.text} ${colour.border}`}
                title={`${label}: ${new Date(deadlineMs).toLocaleTimeString()}`}
            >
                {breached
                    ? <><AlertTriangle className="h-2.5 w-2.5" /> SLA Breach</>
                    : <><Clock className="h-2.5 w-2.5" /> {formatRemaining(remainingMs)}</>
                }
            </span>
        );
    }

    // Full variant — progress bar + label
    return (
        <div className={`rounded border p-3 space-y-2 ${colour.bg} ${colour.border}`}>
            <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold flex items-center gap-1 ${colour.text}`}>
                    {breached ? <AlertTriangle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                    SLA — {label}
                </span>
                <span className={`text-xs font-bold ${colour.text}`}>
                    {isResolved
                        ? breached ? 'Breached' : 'Met ✓'
                        : formatRemaining(remainingMs)
                    }
                </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ${colour.bar}`}
                    style={{ width: `${Math.max(2, pct * 100)}%` }}
                />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Deadline: {new Date(deadlineMs).toLocaleString()}
            </p>
        </div>
    );
};
