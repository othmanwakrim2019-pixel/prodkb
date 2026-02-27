import { useState, useEffect } from 'react';
import { Activity, Database, Server, Wifi, RefreshCw, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import axios from '../utils/axios';

interface HealthComponent {
    name: string;
    status: 'ok' | 'error' | 'unknown';
    icon: React.ReactNode;
    label: string;
}

interface MetricLine {
    name: string;
    value: string;
    help?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const HealthDashboard = () => {
    const [components, setComponents] = useState<HealthComponent[]>([]);
    const [uptime, setUptime] = useState(0);
    const [overallStatus, setOverallStatus] = useState<'ok' | 'degraded' | 'down'>('ok');
    const [metrics, setMetrics] = useState<MetricLine[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastCheck, setLastCheck] = useState<Date>(new Date());

    const fetchHealth = async () => {
        try {
            const res = await axios.get('/health');
            const data = res.data;

            setUptime(data.uptime || 0);

            const comps: HealthComponent[] = [];
            // Always add API as healthy if we got a response
            comps.push({ name: 'api', status: 'ok', icon: <Wifi className="h-5 w-5" />, label: 'API Server' });

            if (data.components) {
                if (data.components.database !== undefined) {
                    comps.push({
                        name: 'database',
                        status: data.components.database === 'connected' ? 'ok' : 'error',
                        icon: <Database className="h-5 w-5" />,
                        label: 'PostgreSQL'
                    });
                }
                if (data.components.redis !== undefined) {
                    comps.push({
                        name: 'redis',
                        status: data.components.redis === 'connected' ? 'ok' : 'error',
                        icon: <Server className="h-5 w-5" />,
                        label: 'Redis'
                    });
                }
                if (data.components.slaWorker !== undefined) {
                    comps.push({
                        name: 'slaWorker',
                        status: data.components.slaWorker === 'healthy' ? 'ok' : data.components.slaWorker === 'no_repeatable_jobs' ? 'ok' : 'error',
                        icon: <Activity className="h-5 w-5" />,
                        label: 'SLA Worker'
                    });
                }
            }

            // Derive overall status from component states
            const hasError = comps.some(c => c.status === 'error');
            setOverallStatus(hasError ? 'degraded' : 'ok');

            setComponents(comps);
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
            const res = await fetch(`${API_BASE}/metrics`);
            const text = await res.text();
            // Parse Prometheus text format into key metrics
            const lines = text.split('\n');
            const parsed: MetricLine[] = [];
            const interesting = [
                'http_requests_total',
                'http_request_duration_seconds',
                'nodejs_heap_size_used_bytes',
                'nodejs_active_handles_total',
                'process_cpu_seconds_total',
                'nodejs_eventloop_lag_seconds',
                'active_users_total',
            ];

            let currentHelp = '';
            for (const line of lines) {
                if (line.startsWith('# HELP')) {
                    currentHelp = line.replace(/^# HELP \S+ /, '');
                }
                if (line.startsWith('#') || !line.trim()) continue;
                const match = line.match(/^(\w+)(?:\{[^}]*\})?\s+([\d.e+-]+)/);
                if (match) {
                    const [, name, value] = match;
                    if (interesting.some(i => name.startsWith(i))) {
                        // Avoid duplicates
                        if (!parsed.find(p => p.name === name)) {
                            parsed.push({ name, value, help: currentHelp });
                        }
                    }
                }
            }
            setMetrics(parsed);
        } catch {
            // Metrics endpoint may not be accessible from frontend
        }
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await Promise.all([fetchHealth(), fetchMetrics()]);
            setLoading(false);
        };
        load();
        const interval = setInterval(load, 30000); // Auto-refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const formatUptime = (seconds: number) => {
        const d = Math.floor(seconds / 86400);
        const h = Math.floor((seconds % 86400) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (d > 0) return `${d}d ${h}h ${m}m`;
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    const formatBytes = (bytes: string) => {
        const b = parseFloat(bytes);
        if (b > 1e9) return `${(b / 1e9).toFixed(1)} GB`;
        if (b > 1e6) return `${(b / 1e6).toFixed(1)} MB`;
        return `${(b / 1e3).toFixed(1)} KB`;
    };

    const statusColor = (s: string) => {
        if (s === 'ok') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
        if (s === 'error') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
        return 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400';
    };

    const statusIcon = (s: string) => {
        if (s === 'ok') return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
        if (s === 'error') return <XCircle className="h-5 w-5 text-red-500" />;
        return <AlertTriangle className="h-5 w-5 text-slate-400" />;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Service Health</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time monitoring of all system components</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                        Last check: {lastCheck.toLocaleTimeString()}
                    </span>
                    <button
                        onClick={async () => { setLoading(true); await Promise.all([fetchHealth(), fetchMetrics()]); setLoading(false); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Overall Status Banner */}
            <div className={`rounded-xl p-5 border ${overallStatus === 'ok' ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' :
                overallStatus === 'degraded' ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' :
                    'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                }`}>
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${overallStatus === 'ok' ? 'bg-emerald-100 dark:bg-emerald-900/40' :
                        overallStatus === 'degraded' ? 'bg-amber-100 dark:bg-amber-900/40' :
                            'bg-red-100 dark:bg-red-900/40'
                        }`}>
                        {overallStatus === 'ok' ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> :
                            overallStatus === 'degraded' ? <AlertTriangle className="h-6 w-6 text-amber-600" /> :
                                <XCircle className="h-6 w-6 text-red-600" />}
                    </div>
                    <div>
                        <h2 className={`text-lg font-bold ${overallStatus === 'ok' ? 'text-emerald-800 dark:text-emerald-300' :
                            overallStatus === 'degraded' ? 'text-amber-800 dark:text-amber-300' :
                                'text-red-800 dark:text-red-300'
                            }`}>
                            {overallStatus === 'ok' ? 'All Systems Operational' :
                                overallStatus === 'degraded' ? 'Partial Degradation' :
                                    'System Down'}
                        </h2>
                        <div className="flex items-center gap-4 mt-1">
                            <span className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                                <Clock className="h-4 w-4" /> Uptime: {formatUptime(uptime)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Service Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {components.map(c => (
                    <div key={c.name} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="text-slate-500 dark:text-slate-400">{c.icon}</div>
                                <h3 className="font-semibold text-slate-800 dark:text-white text-sm">{c.label}</h3>
                            </div>
                            {statusIcon(c.status)}
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(c.status)}`}>
                            {c.status === 'ok' ? 'Operational' : c.status === 'error' ? 'Down' : 'Unknown'}
                        </span>
                    </div>
                ))}
            </div>

            {/* Prometheus Metrics */}
            {metrics.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Prometheus Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {metrics.map(m => (
                            <div key={m.name} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate" title={m.name}>{m.name}</p>
                                <p className="text-lg font-bold text-slate-800 dark:text-white mt-1">
                                    {m.name.includes('bytes') ? formatBytes(m.value) :
                                        m.name.includes('seconds') ? `${parseFloat(m.value).toFixed(3)}s` :
                                            parseFloat(m.value).toLocaleString()}
                                </p>
                                {m.help && <p className="text-xs text-slate-400 mt-0.5 truncate" title={m.help}>{m.help}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HealthDashboard;
