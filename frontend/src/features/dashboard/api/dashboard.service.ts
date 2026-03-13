import api from '../../../utils/axios';

export interface DashboardHealthComponent {
    database?: string;
    redis?: string;
    slaWorker?: string;
}

export interface DashboardHealthStatus {
    uptime?: number;
    components?: DashboardHealthComponent;
}

export interface DashboardMetricLine {
    name: string;
    value: string;
    help?: string;
}

export interface SystemHealth {
    systemId: string;
    systemName: string;
    score: number;
    totalIncidents30d: number;
    resolvedIncidents30d: number;
    avgMttrMinutes: number;
    slaBreachRate: number;
    resolutionRate: number;
    openIncidents: number;
    trend: 'up' | 'down' | 'stable';
}

const API_BASE = import.meta.env.VITE_API_URL || '';

const INTERESTING_METRICS = [
    'http_requests_total',
    'http_request_duration_seconds',
    'nodejs_heap_size_used_bytes',
    'nodejs_active_handles_total',
    'process_cpu_seconds_total',
    'nodejs_eventloop_lag_seconds',
    'active_users_total',
];

function parseMetrics(text: string): DashboardMetricLine[] {
    const lines = text.split('\n');
    const parsed: DashboardMetricLine[] = [];
    let currentHelp = '';

    for (const line of lines) {
        if (line.startsWith('# HELP')) {
            currentHelp = line.replace(/^# HELP \S+ /, '');
            continue;
        }

        if (line.startsWith('#') || !line.trim()) {
            continue;
        }

        const match = line.match(/^(\w+)(?:\{[^}]*\})?\s+([\d.e+-]+)/);
        if (!match) {
            continue;
        }

        const [, name, value] = match;
        if (!INTERESTING_METRICS.some((metricName) => name.startsWith(metricName))) {
            continue;
        }

        if (!parsed.find((metric) => metric.name === name)) {
            parsed.push({ name, value, help: currentHelp });
        }
    }

    return parsed;
}

export const dashboardService = {
    getHealthStatus: (): Promise<DashboardHealthStatus> =>
        api.get('/health').then((response) => response.data),

    getMetrics: async (): Promise<DashboardMetricLine[]> => {
        const response = await fetch(`${API_BASE}/metrics`);
        const text = await response.text();
        return parseMetrics(text);
    },

    getSystemHealthLeaderboard: (): Promise<SystemHealth[]> =>
        api.get('/api/v1/systems/health-leaderboard').then((response) => response.data),
};
