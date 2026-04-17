/**
 * IncidentActivityTimeline
 * Vertical activity feed showing who changed what and when on an incident.
 * Polls every 30 seconds; refreshes after parent signals a change via `refreshToken`.
 */
import { useState, useEffect, useCallback } from 'react';
import {
    Plus, CheckCircle, ArrowRightLeft, AlertTriangle,
    MessageSquare, Paperclip, BookOpen, Users, Shield,
    Clock, RefreshCw,
} from 'lucide-react';
import { incidentService, type ActivityEntry } from '../api/incident.service';

// ── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
}

function absoluteTime(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        dateStyle: 'medium', timeStyle: 'short',
    });
}

// Render **bold** markdown in rawLog strings
function renderMarkdown(text: string): string {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

// ── Icon + colour mapping per logType ───────────────────────────────────────

interface EntryStyle {
    Icon: React.FC<{ className?: string }>;
    dot: string;   // Tailwind bg colour for the dot
    ring: string;  // ring colour
    label: string;
}

function getStyle(entry: ActivityEntry): EntryStyle {
    const raw = (entry.rawLog ?? '').toLowerCase();

    if (entry.logType === 'file') {
        return { Icon: Paperclip, dot: 'bg-purple-500', ring: 'ring-purple-200 dark:ring-purple-900/40', label: 'File' };
    }
    if (entry.logType === 'activity') {
        if (raw.includes('created')) return { Icon: Plus, dot: 'bg-blue-500', ring: 'ring-blue-200 dark:ring-blue-900/40', label: 'Created' };
        if (raw.includes('resolved') || raw.includes('closed')) return { Icon: CheckCircle, dot: 'bg-emerald-500', ring: 'ring-emerald-200 dark:ring-emerald-900/40', label: 'Resolved' };
        if (raw.includes('acknowledged')) return { Icon: Shield, dot: 'bg-teal-500', ring: 'ring-teal-200 dark:ring-teal-900/40', label: 'Acknowledged' };
        if (raw.includes('status')) return { Icon: ArrowRightLeft, dot: 'bg-orange-500', ring: 'ring-orange-200 dark:ring-orange-900/40', label: 'Status' };
        if (raw.includes('severity')) return { Icon: AlertTriangle, dot: 'bg-red-500', ring: 'ring-red-200 dark:ring-red-900/40', label: 'Severity' };
        if (raw.includes('team')) return { Icon: Users, dot: 'bg-violet-500', ring: 'ring-violet-200 dark:ring-violet-900/40', label: 'Team' };
        if (raw.includes('procedure')) return { Icon: BookOpen, dot: 'bg-amber-500', ring: 'ring-amber-200 dark:ring-amber-900/40', label: 'Procedure' };
        if (raw.includes('file')) return { Icon: Paperclip, dot: 'bg-purple-500', ring: 'ring-purple-200 dark:ring-purple-900/40', label: 'File' };
        if (raw.includes('note')) return { Icon: MessageSquare, dot: 'bg-sky-500', ring: 'ring-sky-200 dark:ring-sky-900/40', label: 'Note' };
    }
    // note / investigation / resolution / analysis / communication / other
    return { Icon: MessageSquare, dot: 'bg-sky-500', ring: 'ring-sky-200 dark:ring-sky-900/40', label: 'Note' };
}

function UserAvatar({ name }: { name: string }) {
    const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
            {initials}
        </span>
    );
}

// ── Main Component ───────────────────────────────────────────────────────────

interface Props {
    incidentId: string;
    /** Bump this value to trigger a manual refresh (e.g. after adding a note) */
    refreshToken?: number;
}

export const IncidentActivityTimeline = ({ incidentId, refreshToken }: Props) => {
    const [entries, setEntries] = useState<ActivityEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastFetched, setLastFetched] = useState<Date | null>(null);

    const fetchActivity = useCallback(async () => {
        try {
            const data = await incidentService.getActivity(incidentId);
            setEntries(data);
            setLastFetched(new Date());
            setError(null);
        } catch (e) {
            console.error('Failed to fetch activity', e);
            setError('Failed to load activity.');
        } finally {
            setLoading(false);
        }
    }, [incidentId]);

    // Initial load + refresh token
    useEffect(() => { fetchActivity(); }, [fetchActivity, refreshToken]);

    // Poll every 30 seconds
    useEffect(() => {
        const timer = setInterval(fetchActivity, 30_000);
        return () => clearInterval(timer);
    }, [fetchActivity]);

    // ── Render ──
    if (loading) {
        return (
            <div className="space-y-5 py-2">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex gap-4 animate-pulse">
                        <div className="flex flex-col items-center">
                            <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700" />
                            {i < 3 && <div className="w-px flex-1 mt-1 bg-slate-200 dark:bg-slate-700" />}
                        </div>
                        <div className="pb-5 space-y-1 flex-1">
                            <div className="h-3 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
                            <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center gap-2 text-sm text-red-500 py-4">
                <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="text-center py-10 text-slate-400 dark:text-slate-500">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No activity recorded yet.</p>
                <p className="text-xs mt-1">Activity will appear here as the incident progresses.</p>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Last refreshed bar */}
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {entries.length} {entries.length === 1 ? 'event' : 'events'}
                </span>
                <button
                    onClick={fetchActivity}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors"
                    title={`Last updated: ${lastFetched?.toLocaleTimeString()}`}
                >
                    <RefreshCw className="h-3 w-3" /> Refresh
                </button>
            </div>

            {/* Timeline */}
            <ol className="relative ml-3.5">
                {entries.map((entry, idx) => {
                    const { Icon, dot, ring, label } = getStyle(entry);
                    const isLast = idx === entries.length - 1;

                    return (
                        <li key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
                            {/* Connector line */}
                            {!isLast && (
                                <span
                                    className="absolute left-3.5 top-7 -translate-x-1/2 w-px bg-slate-200 dark:bg-slate-700"
                                    style={{ bottom: 0 }}
                                    aria-hidden
                                />
                            )}

                            {/* Dot */}
                            <div className="relative z-10 flex-shrink-0">
                                <span className={`flex h-7 w-7 items-center justify-center rounded-full ring-4 ${dot} ${ring}`}>
                                    <Icon className="h-3.5 w-3.5 text-white" />
                                </span>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 pt-0.5">
                                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                    {/* Actor */}
                                    {entry.createdBy ? (
                                        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 shrink-0">
                                            <UserAvatar name={entry.createdBy.name} />
                                            {entry.createdBy.name}
                                        </span>
                                    ) : (
                                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 italic shrink-0">
                                            System
                                        </span>
                                    )}

                                    {/* Type badge */}
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                        {label}
                                    </span>
                                </div>

                                {/* Message */}
                                {entry.rawLog && (
                                    <p
                                        className="mt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: renderMarkdown(entry.rawLog) }}
                                    />
                                )}
                                {entry.logType === 'file' && entry.fileName && (
                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                        <Paperclip className="h-3.5 w-3.5 shrink-0 text-purple-400" />
                                        {entry.fileName}
                                    </p>
                                )}

                                {/* Timestamp */}
                                <time
                                    className="mt-1 block text-[11px] text-slate-400 dark:text-slate-500 cursor-default"
                                    dateTime={entry.createdAt}
                                    title={absoluteTime(entry.createdAt)}
                                >
                                    {relativeTime(entry.createdAt)}
                                    <span className="sr-only"> — {absoluteTime(entry.createdAt)}</span>
                                </time>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
};
