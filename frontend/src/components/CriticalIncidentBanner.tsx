/**
 * CriticalIncidentBanner — sticky alert bar shown when there are
 * active Critical or High incidents. Polls every 60s. Dismissible per session.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, X, ArrowRight, Flame } from 'lucide-react';
import { incidentService } from '../features/incidents/api/incident.service';
import type { Incident } from '../types';

const DISMISS_KEY = 'prodkb_critical_banner_dismissed_at';

function wasRecentlyDismissed(): boolean {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) return false;
    // Dismissed for 30 minutes
    return Date.now() - Number(ts) < 30 * 60_000;
}

export const CriticalIncidentBanner = () => {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [dismissed, setDismissed] = useState(wasRecentlyDismissed);
    const navigate = useNavigate();

    const fetchCritical = useCallback(async () => {
        if (dismissed) return;
        try {
            // Fetch open Critical + High incidents (limit 5)
            const [critical, high] = await Promise.all([
                incidentService.getAll({ status: 'Open', severity: 'Critical', limit: 3 }),
                incidentService.getAll({ status: 'Open', severity: 'High', limit: 3 }),
            ]);
            const all = [...(critical.data ?? []), ...(high.data ?? [])];
            // Deduplicate
            const seen = new Set<string>();
            setIncidents(all.filter(inc => { if (seen.has(inc.id)) return false; seen.add(inc.id); return true; }).slice(0, 5));
        } catch {
            // silent
        }
    }, [dismissed]);

    useEffect(() => {
        fetchCritical();
        const interval = setInterval(fetchCritical, 60_000);
        return () => clearInterval(interval);
    }, [fetchCritical]);

    const handleDismiss = () => {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
        setDismissed(true);
    };

    if (dismissed || incidents.length === 0) return null;

    const critical = incidents.filter(i => i.severity === 'Critical');
    const high = incidents.filter(i => i.severity === 'High');

    return (
        <div className="bg-red-600 dark:bg-red-700 text-white px-4 py-2.5 flex items-center gap-3 shadow-sm z-20 relative">
            {/* Flame icon */}
            <div className="flex items-center gap-1.5 shrink-0">
                <Flame className="h-4 w-4 animate-pulse text-red-200" />
                <span className="text-xs font-bold uppercase tracking-wider text-red-100">Live Alert</span>
            </div>

            <div className="w-px h-4 bg-red-400 shrink-0" />

            {/* Summary */}
            <div className="flex-1 flex items-center gap-3 min-w-0 overflow-hidden">
                {critical.length > 0 && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold shrink-0">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {critical.length} Critical
                    </span>
                )}
                {high.length > 0 && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-red-200 shrink-0">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {high.length} High
                    </span>
                )}
                <span className="hidden md:block text-xs text-red-200 truncate">
                    {incidents.slice(0, 2).map(i => i.title).join(' · ')}
                    {incidents.length > 2 ? ` +${incidents.length - 2} more` : ''}
                </span>
            </div>

            {/* View button */}
            <button
                onClick={() => navigate('/incidents?status=Open&severity=Critical')}
                className="shrink-0 flex items-center gap-1 text-xs font-semibold bg-red-700 dark:bg-red-800 hover:bg-red-800 dark:hover:bg-red-900 px-2.5 py-1 rounded transition-colors border border-red-500"
            >
                View <ArrowRight className="h-3 w-3" />
            </button>

            {/* Dismiss */}
            <button
                onClick={handleDismiss}
                className="shrink-0 p-1 rounded hover:bg-red-700 dark:hover:bg-red-800 transition-colors text-red-200 hover:text-white"
                title="Dismiss for 30 minutes"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
};
