import { useEffect, useState } from 'react';
import { Activity, Database, Server, Wifi, RefreshCw, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { dashboardService, type DashboardMetricLine, type DashboardHealthStatus } from '../../dashboard/api/dashboard.service';

interface HealthComponent {
    name: string;
    status: 'ok' | 'error' | 'unknown';
    icon: React.ReactNode;
    label: string;
}

function formatUptime(seconds: number) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

function formatBytes(bytes: string) {
    const value = parseFloat(bytes);
    if (value > 1e9) return `${(value / 1e9).toFixed(1)} GB`;
    if (value > 1e6) return `${(value / 1e6).toFixed(1)} MB`;
    return `${(value / 1e3).toFixed(1)} KB`;
}

function buildComponents(data: DashboardHealthStatus): HealthComponent[] {
    const components: HealthComponent[] = [
        { name: 'api', status: 'ok', icon: <Wifi className="h-5 w-5" />, label: 'API Server' },
    ];

    if (data.components?.database !== undefined) {
        components.push({
            name: 'database',
            status: data.components.database === 'connected' ? 'ok' : 'error',
            icon: <Database className="h-5 w-5" />,
            label: 'PostgreSQL',
        });
    }

    if (data.components?.redis !== undefined) {
        components.push({
            name: 'redis',
            status: data.components.redis === 'connected' ? 'ok' : 'error',
            icon: <Server className="h-5 w-5" />,
            label: 'Redis',
        });
    }

    if (data.components?.slaWorker !== undefined) {
        components.push({
            name: 'slaWorker',
            status: data.components.slaWorker === 'healthy' || data.components.slaWorker === 'no_repeatable_jobs' ? 'ok' : 'error',
            icon: <Activity className="h-5 w-5" />,
            label: 'SLA Worker',
        });
    }

    return components;
}

function statusColor(status: string) {
    if (status === 'ok') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (status === 'error') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400';
}

function statusIcon(status: string) {
    if (status === 'ok') return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    if (status === 'error') return <XCircle className="h-5 w-5 text-red-500" />;
    return <AlertTriangle className="h-5 w-5 text-slate-400" />;
}

export const HealthDashboardPage = () => {
    const [components, setComponents] = useState<HealthComponent[]>([]);
    const [uptime, setUptime] = useState(0);
    const [overallStatus, setOverallStatus] = useState<'ok' | 'degraded' | 'down'>('ok');
    const [metrics, setMetrics] = useState<DashboardMetricLine[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastCheck, setLastCheck] = useState<Date>(new Date());

    const fetchHealth = async () => {
        try {
            const data = await dashboardService.getHealthStatus();
            setUptime(data.uptime || 0);
            const nextComponents = buildComponents(data);
            setOverallStatus(nextComponents.some((component) => component.status === 'error') ? 'degraded' : 'ok');
            setComponents(nextComponents);
            setLastCheck(new Date());
        } catch {
            setOverallStatus('down');
            setComponents([
                { name: 'api', status: 'error', icon: <Wifi className="h-5 w-5" />, label: 'API Server' },
                { name: 'database', status: 'unknown', icon: <Database className="h-5 w-5" />, label: 'PostgreSQL' },
                { name: 'redis', status: 'unknown', icon: <Server className="h-5 w-5" />, label: 'Redis' },
                { name: 'slaWorker', status: 'unknown', icon: <Activity className="h-5 w-5" />, label: 'SLA Worker' },
            ]);
        }
    };

    const fetchMetrics = async () => {
        try {
            const nextMetrics = await dashboardService.getMetrics();
            setMetrics(nextMetrics);
        } catch {
            setMetrics([]);
        }
    };

    const refresh = async () => {
        setLoading(true);
        await Promise.all([fetchHealth(), fetchMetrics()]);
        setLoading(false);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Service Health</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Real-time monitoring of all system components</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">Last check: {lastCheck.toLocaleTimeString()}</span>
                    <button
                        onClick={refresh}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                        type="button"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            <div className={`rounded-xl border p-5 ${
                overallStatus === 'ok'
                    ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20'
                    : overallStatus === 'degraded'
                        ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
                        : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
            }`}>
                <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                        overallStatus === 'ok'
                            ? 'bg-emerald-100 dark:bg-emerald-900/40'
                            : overallStatus === 'degraded'
                                ? 'bg-amber-100 dark:bg-amber-900/40'
                                : 'bg-red-100 dark:bg-red-900/40'
                    }`}>
                        {overallStatus === 'ok'
                            ? <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                            : overallStatus === 'degraded'
                                ? <AlertTriangle className="h-6 w-6 text-amber-600" />
                                : <XCircle className="h-6 w-6 text-red-600" />}
                    </div>
                    <div>
                        <h2 className={`text-lg font-bold ${
                            overallStatus === 'ok'
                                ? 'text-emerald-800 dark:text-emerald-300'
                                : overallStatus === 'degraded'
                                    ? 'text-amber-800 dark:text-amber-300'
                                    : 'text-red-800 dark:text-red-300'
                        }`}>
                            {overallStatus === 'ok' ? 'All Systems Operational' : overallStatus === 'degraded' ? 'Partial Degradation' : 'System Down'}
                        </h2>
                        <div className="mt-1 flex items-center gap-4">
                            <span className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                                <Clock className="h-4 w-4" /> Uptime: {formatUptime(uptime)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {components.map((component) => (
                    <div key={component.name} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                        <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="text-slate-500 dark:text-slate-400">{component.icon}</div>
                                <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{component.label}</h3>
                            </div>
                            {statusIcon(component.status)}
                        </div>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(component.status)}`}>
                            {component.status === 'ok' ? 'Operational' : component.status === 'error' ? 'Down' : 'Unknown'}
                        </span>
                    </div>
                ))}
            </div>

            {metrics.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Prometheus Metrics</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {metrics.map((metric) => (
                            <div key={metric.name} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
                                <p className="truncate font-mono text-xs text-slate-500 dark:text-slate-400" title={metric.name}>{metric.name}</p>
                                <p className="mt-1 text-lg font-bold text-slate-800 dark:text-white">
                                    {metric.name.includes('bytes')
                                        ? formatBytes(metric.value)
                                        : metric.name.includes('seconds')
                                            ? `${parseFloat(metric.value).toFixed(3)}s`
                                            : parseFloat(metric.value).toLocaleString()}
                                </p>
                                {metric.help && <p className="mt-0.5 truncate text-xs text-slate-400" title={metric.help}>{metric.help}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HealthDashboardPage;
