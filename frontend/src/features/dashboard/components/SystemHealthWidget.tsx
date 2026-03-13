import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Activity, AlertTriangle, Clock, CheckCircle, Info } from 'lucide-react';
import { dashboardService, type SystemHealth } from '../api/dashboard.service';

function getScoreColor(score: number): string {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
}

function getScoreBg(score: number): string {
    if (score >= 80) return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
    if (score >= 60) return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
}

function getScoreLabel(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Watch';
    if (score >= 40) return 'Degraded';
    return 'Critical';
}

function getScoreRingColor(score: number): string {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-slate-400" />;
}

function ScoreRing({ score }: { score: number }) {
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;
    const color = getScoreRingColor(score);

    return (
        <div className="relative h-16 w-16 flex-shrink-0">
            <svg className="h-16 w-16 -rotate-90 transform" viewBox="0 0 64 64">
                <circle
                    cx="32"
                    cy="32"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-700"
                    strokeWidth="4"
                />
                <circle
                    cx="32"
                    cy="32"
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - progress}
                    style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${getScoreColor(score)}`}>
                {score}
            </span>
        </div>
    );
}

export function SystemHealthWidget() {
    const [systems, setSystems] = useState<SystemHealth[]>([]);
    const [loading, setLoading] = useState(true);
    const [showLegend, setShowLegend] = useState(false);

    useEffect(() => {
        const loadSystems = async () => {
            try {
                const nextSystems = await dashboardService.getSystemHealthLeaderboard();
                setSystems(Array.isArray(nextSystems) ? nextSystems : []);
            } catch {
                setSystems([]);
            } finally {
                setLoading(false);
            }
        };

        loadSystems();
    }, []);

    if (loading) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
                <div className="space-y-4 animate-pulse">
                    <div className="h-5 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-20 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-20 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
            </div>
        );
    }

    if (systems.length === 0) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
                <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                    <Activity className="h-5 w-5 text-blue-500" />
                    System Health
                </h3>
                <p className="text-sm text-slate-500">No systems are configured yet.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-2 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                    <Activity className="h-5 w-5 text-blue-500" />
                    System Health
                </h3>
                <button
                    onClick={() => setShowLegend(!showLegend)}
                    className="text-slate-400 transition-colors hover:text-blue-500"
                    title="How to read this panel"
                    type="button"
                >
                    <Info className="h-5 w-5" />
                </button>
            </div>

            <p className="mb-4 text-xs text-slate-400">
                Health score is based on open incidents, resolution rate, SLA performance, and average resolution time over the last 30 days.
            </p>

            {showLegend && (
                <div className="mb-4 space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-300">
                    <p className="mb-1 font-semibold text-slate-700 dark:text-slate-200">How the score is calculated</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <span><b>Open incidents</b> - 35%</span>
                        <span><b>Resolution rate</b> - 25%</span>
                        <span><b>SLA compliance</b> - 20%</span>
                        <span><b>Resolution time</b> - 20%</span>
                    </div>
                    <hr className="my-1.5 border-slate-200 dark:border-slate-600" />
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> 80-100 Good</span>
                        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> 60-79 Watch</span>
                        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> 0-59 Critical</span>
                    </div>
                </div>
            )}

            <div className="space-y-2.5">
                {systems.map((system, index) => (
                    <div
                        key={system.systemId}
                        className={`flex items-center gap-4 rounded-lg border p-3 transition-all hover:shadow-sm ${getScoreBg(system.score)}`}
                    >
                        <span className="w-5 text-center text-xs font-bold text-slate-400">#{index + 1}</span>
                        <ScoreRing score={system.score} />
                        <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-2">
                                <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                    {system.systemName}
                                </span>
                                <TrendIcon trend={system.trend} />
                                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                    system.score >= 80
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                        : system.score >= 60
                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                }`}>
                                    {getScoreLabel(system.score)}
                                </span>
                            </div>
                            <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1" title="Currently open incidents">
                                    <AlertTriangle className={`h-3 w-3 ${system.openIncidents > 0 ? 'text-red-500' : 'text-emerald-500'}`} />
                                    <b>{system.openIncidents}</b> open
                                </span>
                                <span className="flex items-center gap-1" title="Average resolution time over the last 30 days">
                                    <Clock className="h-3 w-3" />
                                    MTTR {system.avgMttrMinutes > 0 ? `${system.avgMttrMinutes}m` : '-'}
                                </span>
                                <span className="flex items-center gap-1" title={`${system.resolvedIncidents30d} resolved out of ${system.totalIncidents30d} incidents over the last 30 days`}>
                                    <CheckCircle className={`h-3 w-3 ${system.resolutionRate >= 0.8 ? 'text-emerald-500' : system.resolutionRate >= 0.5 ? 'text-amber-500' : 'text-red-500'}`} />
                                    Resolved {system.resolvedIncidents30d}/{system.totalIncidents30d}
                                    <span className="text-slate-400">({Math.round(system.resolutionRate * 100)}%)</span>
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
