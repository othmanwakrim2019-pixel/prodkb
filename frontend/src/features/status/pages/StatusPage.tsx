import { useState, useEffect } from 'react';
import { Clock, CheckCircle, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import { statusService, type MaintenanceEntry, type StatusData } from '../api/status.service';

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
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours === 0) return `${minutes}min`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h${minutes.toString().padStart(2, '0')}`;
}

function isActive(maintenance: MaintenanceEntry) {
    const now = Date.now();
    return new Date(maintenance.scheduledAt).getTime() <= now && new Date(maintenance.endsAt).getTime() > now;
}

function isUpcoming(maintenance: MaintenanceEntry) {
    return new Date(maintenance.scheduledAt).getTime() > Date.now();
}

export default function StatusPage() {
    const [data, setData] = useState<StatusData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    const fetchData = async () => {
        try {
            const status = await statusService.getStatus();
            setData(status);
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
        <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Statut Public</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Calendrier des maintenances planifiees sur les systemes
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                    <span>Mis a jour a {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    <button
                        onClick={fetchData}
                        className="ml-1 rounded-md bg-slate-100 px-2 py-1 text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                        type="button"
                    >
                        Actualiser
                    </button>
                </div>
            </div>

            {!loading && (
                <div className={`flex items-center gap-4 rounded-xl border px-5 py-4 ${active.length > 0
                    ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                    : upcoming.length > 0
                        ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/15'
                        : 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/15'
                    }`}>
                    <span className="relative flex h-3 w-3 flex-shrink-0">
                        {active.length > 0 && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />}
                        <span className={`relative inline-flex h-3 w-3 rounded-full ${active.length > 0 ? 'bg-blue-500' : upcoming.length > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    </span>
                    <div>
                        <p className={`text-sm font-semibold ${active.length > 0
                            ? 'text-blue-700 dark:text-blue-300'
                            : upcoming.length > 0
                                ? 'text-amber-700 dark:text-amber-300'
                                : 'text-emerald-700 dark:text-emerald-300'
                            }`}>
                            {active.length > 0
                                ? `Maintenance en cours - ${active.length} systeme${active.length > 1 ? 's' : ''} concerne${active.length > 1 ? 's' : ''}`
                                : upcoming.length > 0
                                    ? `${upcoming.length} maintenance${upcoming.length > 1 ? 's' : ''} planifiee${upcoming.length > 1 ? 's' : ''}`
                                    : 'Aucune maintenance planifiee'}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {active.length > 0
                                ? 'Une intervention est actuellement en cours sur un ou plusieurs systemes.'
                                : upcoming.length > 0
                                    ? 'Des interventions sont programmees dans les prochains jours.'
                                    : 'Tous les systemes fonctionnent normalement. Aucune intervention prevue.'}
                        </p>
                    </div>
                </div>
            )}

            {active.length > 0 && (
                <section>
                    <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        <AlertCircle size={12} className="text-blue-500" />
                        En cours
                    </h2>
                    <div className="space-y-3">
                        {active.map((maintenance) => (
                            <div key={maintenance.id} className="overflow-hidden rounded-xl border border-blue-200 bg-white shadow-sm dark:border-blue-800 dark:bg-slate-800">
                                <div className="h-1 bg-blue-500" />
                                <div className="p-5">
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div>
                                            <span className="mb-2 inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                                {maintenance.systemName}
                                            </span>
                                            <h3 className="text-base font-bold text-slate-900 dark:text-white">{maintenance.title}</h3>
                                            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                <Calendar size={11} />
                                                <span>{formatDate(maintenance.scheduledAt)}</span>
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 text-right">
                                            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                                {formatTime(maintenance.scheduledAt)} - {formatTime(maintenance.endsAt)}
                                            </div>
                                            <div className="mt-1 text-xs text-slate-400">
                                                Duree : {formatDuration(maintenance.scheduledAt, maintenance.endsAt)}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                Fin : {formatDate(maintenance.endsAt)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {upcoming.length > 0 && (
                <section>
                    <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        <Clock size={12} />
                        Prochaines interventions
                    </h2>
                    <div className="space-y-2">
                        {upcoming.map((maintenance) => (
                            <div key={maintenance.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <span className="mb-2 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                                            {maintenance.systemName}
                                        </span>
                                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{maintenance.title}</h3>
                                        <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
                                            <Calendar size={11} />
                                            <span>{formatDate(maintenance.scheduledAt)}</span>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 text-right">
                                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            {formatTime(maintenance.scheduledAt)} - {formatTime(maintenance.endsAt)}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-400">Duree : {formatDuration(maintenance.scheduledAt, maintenance.endsAt)}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {!loading && !hasAny && (
                <div className="rounded-xl border border-slate-200 bg-white px-8 py-16 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20">
                        <CheckCircle size={24} className="text-emerald-500" />
                    </div>
                    <h3 className="mb-2 text-base font-bold text-slate-900 dark:text-white">Aucune maintenance planifiee</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Tous les systemes fonctionnent normalement.
                        <br />
                        Revenez consulter cette page pour etre informe des prochaines interventions.
                    </p>
                </div>
            )}

            {loading && (
                <div className="rounded-xl border border-slate-200 bg-white py-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                    <p className="text-sm text-slate-500">Chargement du statut...</p>
                </div>
            )}

            <p className="pb-4 text-center text-xs text-slate-400 dark:text-slate-600">
                Actualisation automatique toutes les 30 secondes
            </p>
        </div>
    );
}
