import { useState, useEffect } from 'react';
import { Clock, CheckCircle, Calendar, AlertCircle, RefreshCw } from 'lucide-react';

interface MaintenanceEntry {
    id: string;
    systemName: string;
    title: string;
    scheduledAt: string;
    endsAt: string;
}

interface StatusData {
    upcomingMaintenances: MaintenanceEntry[];
    lastUpdated: string;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(start: string, end: string) {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h${m.toString().padStart(2, '0')}`;
}

function isActive(m: MaintenanceEntry) {
    const now = Date.now();
    return new Date(m.scheduledAt).getTime() <= now && new Date(m.endsAt).getTime() > now;
}

function isUpcoming(m: MaintenanceEntry) {
    return new Date(m.scheduledAt).getTime() > Date.now();
}

export default function StatusPage() {
    const [data, setData] = useState<StatusData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    const fetchData = async () => {
        try {
            const res = await fetch('/status-data');
            const json = await res.json();
            setData(json);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
            setLastRefresh(new Date());
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const maintenances = data?.upcomingMaintenances ?? [];
    const active = maintenances.filter(isActive);
    const upcoming = maintenances.filter(isUpcoming);
    const hasAny = maintenances.length > 0;

    return (
        <div className="max-w-3xl mx-auto space-y-6">

            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Statut Public</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Calendrier des maintenances planifiées sur les systèmes
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                    <span>Mis à jour à {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    <button onClick={fetchData} className="ml-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-slate-600 dark:text-slate-300">
                        Actualiser
                    </button>
                </div>
            </div>

            {/* Overall status banner */}
            {!loading && (
                <div className={`rounded-xl border px-5 py-4 flex items-center gap-4 ${active.length > 0
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    : upcoming.length > 0
                        ? 'bg-amber-50 dark:bg-amber-900/15 border-amber-200 dark:border-amber-800'
                        : 'bg-emerald-50 dark:bg-emerald-900/15 border-emerald-200 dark:border-emerald-800'
                    }`}>
                    <span className={`relative flex h-3 w-3 flex-shrink-0`}>
                        {active.length > 0 && <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping" />}
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${active.length > 0 ? 'bg-blue-500' : upcoming.length > 0 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`} />
                    </span>
                    <div>
                        <p className={`font-semibold text-sm ${active.length > 0
                            ? 'text-blue-700 dark:text-blue-300'
                            : upcoming.length > 0
                                ? 'text-amber-700 dark:text-amber-300'
                                : 'text-emerald-700 dark:text-emerald-300'
                            }`}>
                            {active.length > 0
                                ? `Maintenance en cours — ${active.length} système${active.length > 1 ? 's' : ''} concerné${active.length > 1 ? 's' : ''}`
                                : upcoming.length > 0
                                    ? `${upcoming.length} maintenance${upcoming.length > 1 ? 's' : ''} planifiée${upcoming.length > 1 ? 's' : ''}`
                                    : 'Aucune maintenance planifiée'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {active.length > 0
                                ? 'Une intervention est actuellement en cours sur un ou plusieurs systèmes.'
                                : upcoming.length > 0
                                    ? 'Des interventions sont programmées dans les prochains jours.'
                                    : 'Tous les systèmes fonctionnent normalement. Aucune intervention prévue.'}
                        </p>
                    </div>
                </div>
            )}

            {/* Active maintenance */}
            {active.length > 0 && (
                <section>
                    <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <AlertCircle size={12} className="text-blue-500" />
                        En cours
                    </h2>
                    <div className="space-y-3">
                        {active.map(m => (
                            <div key={m.id} className="bg-white dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm overflow-hidden">
                                <div className="h-1 bg-blue-500" />
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-4 flex-wrap">
                                        <div>
                                            <span className="inline-block text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-full mb-2">
                                                {m.systemName}
                                            </span>
                                            <h3 className="text-base font-bold text-slate-900 dark:text-white">{m.title}</h3>
                                            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
                                                <Calendar size={11} />
                                                <span>{formatDate(m.scheduledAt)}</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                                {formatTime(m.scheduledAt)} – {formatTime(m.endsAt)}
                                            </div>
                                            <div className="text-xs text-slate-400 mt-1">
                                                Durée : {formatDuration(m.scheduledAt, m.endsAt)}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                Fin : {formatDate(m.endsAt)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Upcoming maintenance */}
            {upcoming.length > 0 && (
                <section>
                    <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Clock size={12} />
                        Prochaines interventions
                    </h2>
                    <div className="space-y-2">
                        {upcoming.map(m => (
                            <div key={m.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                    <div>
                                        <span className="inline-block text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 rounded-full mb-2">
                                            {m.systemName}
                                        </span>
                                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{m.title}</h3>
                                        <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                                            <Calendar size={11} />
                                            <span>{formatDate(m.scheduledAt)}</span>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            {formatTime(m.scheduledAt)} – {formatTime(m.endsAt)}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1">Durée : {formatDuration(m.scheduledAt, m.endsAt)}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Empty state */}
            {!loading && !hasAny && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center py-16 px-8">
                    <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={24} className="text-emerald-500" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Aucune maintenance planifiée</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Tous les systèmes fonctionnent normalement.<br />
                        Revenez consulter cette page pour être informé des prochaines interventions.
                    </p>
                </div>
            )}

            {/* Loading state */}
            {loading && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center py-12">
                    <div className="animate-spin h-7 w-7 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Chargement du statut…</p>
                </div>
            )}

            {/* Footer note */}
            <p className="text-center text-xs text-slate-400 dark:text-slate-600 pb-4">
                Actualisation automatique toutes les 30 secondes
            </p>
        </div>
    );
}
