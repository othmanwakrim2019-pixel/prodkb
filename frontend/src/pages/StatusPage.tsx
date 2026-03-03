import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Wrench, Clock, TrendingUp, RefreshCw, Globe } from 'lucide-react';

interface SystemStatus {
    systemId: string;
    systemName: string;
    status: 'operational' | 'degraded' | 'outage' | 'maintenance';
    openIncidents: number;
    criticalCount: number;
    highCount: number;
    activeMaintenance: { title: string; scheduledAt: string; endsAt: string } | null;
    uptime30d: number;
    recentIncidents: Array<{
        id: string;
        title: string;
        severity: string;
        status: string;
        resolvedAt: string | null;
        createdAt: string;
    }>;
}

interface StatusData {
    systems: SystemStatus[];
    lastUpdated: string;
    overallStatus: 'operational' | 'degraded' | 'outage' | 'maintenance';
    upcomingMaintenances: Array<{
        id: string;
        systemName: string;
        title: string;
        scheduledAt: string;
        endsAt: string;
    }>;
}

const statusConfig = {
    operational: {
        label: 'Opérationnel',
        icon: CheckCircle,
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-500',
        banner: 'from-emerald-600 to-emerald-700',
    },
    degraded: {
        label: 'Dégradé',
        icon: AlertTriangle,
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500',
        banner: 'from-amber-500 to-amber-600',
    },
    outage: {
        label: 'En panne',
        icon: XCircle,
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
        dot: 'bg-red-500 animate-pulse',
        banner: 'from-red-600 to-red-700',
    },
    maintenance: {
        label: 'Maintenance',
        icon: Wrench,
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
        dot: 'bg-blue-500',
        banner: 'from-blue-600 to-blue-700',
    },
};

function formatTime(iso: string) {
    return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
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
            // silently fail — retry on next refresh
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => { fetchData(); setLastRefresh(new Date()); }, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-slate-500">Chargement du statut...</p>
                </div>
            </div>
        );
    }

    const overall = data?.overallStatus ?? 'operational';
    const cfg = statusConfig[overall];
    const OverallIcon = cfg.icon;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans">
            {/* Hero Banner */}
            <div className={`bg-gradient-to-r ${cfg.banner} text-white py-10 px-6 text-center`}>
                <div className="flex items-center justify-center gap-3 mb-2">
                    <Globe className="h-6 w-6 opacity-80" />
                    <h1 className="text-2xl font-bold tracking-tight">Statut des Systèmes</h1>
                </div>
                <div className="flex items-center justify-center gap-2 text-white/90">
                    <OverallIcon className="h-5 w-5" />
                    <span className="text-lg font-medium">{cfg.label}</span>
                </div>
                <p className="text-white/60 text-xs mt-2">
                    Mis à jour toutes les 30 secondes · Dernière mise à jour : {formatTime(lastRefresh.toISOString())}
                </p>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
                {/* Upcoming Maintenances */}
                {data?.upcomingMaintenances && data.upcomingMaintenances.length > 0 && (
                    <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
                        <h2 className="text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2 mb-3">
                            <Wrench className="h-4 w-4" /> Maintenances planifiées (7 prochains jours)
                        </h2>
                        <div className="space-y-2">
                            {data.upcomingMaintenances.map(m => (
                                <div key={m.id} className="flex items-center justify-between text-sm">
                                    <div>
                                        <span className="font-medium text-slate-700 dark:text-slate-200">{m.systemName}</span>
                                        <span className="text-slate-500 dark:text-slate-400"> — {m.title}</span>
                                    </div>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatTime(m.scheduledAt)} → {formatTime(m.endsAt)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Systems */}
                <div>
                    <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                        État des systèmes ({data?.systems.length ?? 0})
                    </h2>
                    <div className="space-y-2">
                        {data?.systems.map(sys => {
                            const c = statusConfig[sys.status];
                            return (
                                <div key={sys.systemId} className={`flex items-center justify-between p-3.5 rounded-xl border ${c.bg}`}>
                                    <div className="flex items-center gap-3">
                                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${c.dot}`} />
                                        <span className="font-medium text-slate-900 dark:text-white text-sm">{sys.systemName}</span>
                                        {sys.activeMaintenance && (
                                            <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                                                {sys.activeMaintenance.title}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                        {sys.openIncidents > 0 && (
                                            <span className="flex items-center gap-1">
                                                <AlertTriangle className={`h-3 w-3 ${sys.criticalCount > 0 ? 'text-red-500' : 'text-amber-500'}`} />
                                                {sys.openIncidents} ouverts
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <TrendingUp className="h-3 w-3 text-emerald-500" />
                                            {sys.uptime30d}%
                                        </span>
                                        <span className={`font-medium ${c.color}`}>{c.label}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-slate-400 pt-4 flex items-center justify-center gap-1">
                    <RefreshCw className="h-3 w-3" /> Actualisation automatique toutes les 30 secondes
                </div>
            </div>
        </div>
    );
}
