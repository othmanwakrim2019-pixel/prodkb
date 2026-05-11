import { useEffect, useState } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    ClipboardCheck,
    RefreshCw,
    ServerCog,
    XCircle,
} from 'lucide-react';
import { readinessService, type OperationsReadiness, type ReadinessCheck } from '../api/admin.service';

const statusStyles = {
    ok: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300',
    warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
    critical: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300',
};

const iconFor = (status: ReadinessCheck['status']) => {
    if (status === 'ok') return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    if (status === 'critical') return <XCircle className="h-5 w-5 text-red-500" />;
    return <AlertTriangle className="h-5 w-5 text-amber-500" />;
};

const metricLabels: Array<[keyof OperationsReadiness['metrics'], string]> = [
    ['openCriticalIncidents', 'Critical Open'],
    ['openHighIncidents', 'High Open'],
    ['blockedTasks', 'Blocked Tasks'],
    ['uncoveredAstreinteSlots', 'Astreinte Gaps'],
    ['jobsWithoutTeam', 'Jobs Without Team'],
    ['failedWebhookDeliveries', 'Webhook Failures'],
    ['dailyPlansToday', 'Daily Plans Today'],
    ['activeWebhooks', 'Active Webhooks'],
];

export const OperationsReadinessPage = () => {
    const [data, setData] = useState<OperationsReadiness | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const next = await readinessService.getOperationsReadiness();
            setData(next);
        } catch (err) {
            console.error('Failed to load operations readiness', err);
            setError('Failed to load operations readiness');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    if (loading && !data) return <div className="p-8">Loading operations readiness...</div>;

    if (error && !data) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
                {error}
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ClipboardCheck className="h-7 w-7 text-primary" />
                        Operations Readiness
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Setup quality, data coverage, and operational gaps across ProdKB.
                    </p>
                </div>
                <button
                    onClick={load}
                    type="button"
                    className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            <div className={`rounded-xl border p-6 ${statusStyles[data.status]}`}>
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-wide">Readiness Score</p>
                        <div className="mt-2 flex items-end gap-3">
                            <span className="text-5xl font-bold">{data.score}</span>
                            <span className="pb-1 text-lg font-semibold">/ 100</span>
                        </div>
                    </div>
                    <div className="max-w-xl text-sm">
                        <p className="font-semibold">
                            {data.status === 'ok' ? 'The platform is ready for operations.' : data.status === 'critical' ? 'Critical operational gaps need attention.' : 'The platform is usable, with setup gaps to close.'}
                        </p>
                        <p className="mt-1 opacity-80">Last generated: {new Date(data.generatedAt).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {metricLabels.map(([key, label]) => (
                    <div key={key} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                            {String(data.metrics[key])}
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {data.checks.map(check => (
                    <div key={check.id} className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                        <div className="flex items-start gap-3">
                            {iconFor(check.status)}
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="font-semibold text-slate-900 dark:text-white">{check.label}</h3>
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${check.status === 'ok' ? 'bg-emerald-100 text-emerald-700' : check.status === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {check.status}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{check.detail}</p>
                                <p className="mt-2 text-xs font-medium text-slate-500">{check.action}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Data Gaps</h3>
                    <div className="mt-3 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                        <p>Teams without email: {data.gaps.teamsWithoutEmail.length || 0}</p>
                        <p>Teams without members: {data.gaps.teamsWithoutMembers.length || 0}</p>
                        <p>Missing SLA severities: {data.gaps.missingSlaSeverities.join(', ') || 'None'}</p>
                    </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Astreinte Gaps</h3>
                    <div className="mt-3 max-h-36 space-y-2 overflow-auto text-sm text-slate-600 dark:text-slate-300">
                        {data.gaps.uncoveredAstreinteSlots.length === 0 ? (
                            <p>No uncovered slots in the next 4 weeks.</p>
                        ) : data.gaps.uncoveredAstreinteSlots.map(slot => (
                            <p key={`${slot.teamId}-${slot.weekNumber}-${slot.year}`}>{slot.teamName}: week {slot.weekNumber}, {slot.year}</p>
                        ))}
                    </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                    <h3 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                        <ServerCog className="h-4 w-4" />
                        Workers
                    </h3>
                    <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                        {data.workers.map(worker => (
                            <div key={worker.name} className="flex items-start justify-between gap-3">
                                <span>{worker.name}</span>
                                <span className={worker.expected ? 'text-emerald-600' : 'text-amber-600'}>{worker.expected ? 'expected' : 'missing'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OperationsReadinessPage;
