import { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import { TrendingUp, TrendingDown, Minus, Activity, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

interface SystemHealth {
    systemId: string;
    systemName: string;
    score: number;
    incidentCount30d: number;
    avgMttrMinutes: number;
    slaBreachRate: number;
    resolutionRate: number;
    openIncidents: number;
    trend: 'up' | 'down' | 'stable';
}

function getScoreColor(score: number): string {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
}

function getScoreBg(score: number): string {
    if (score >= 80) return 'bg-emerald-100 dark:bg-emerald-900/30';
    if (score >= 60) return 'bg-amber-100 dark:bg-amber-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
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
        <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r={radius} fill="none" stroke="currentColor"
                    className="text-slate-200 dark:text-slate-700" strokeWidth="4" />
                <circle cx="32" cy="32" r={radius} fill="none" stroke={color}
                    strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - progress}
                    style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
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

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get('/api/v1/systems/health-leaderboard');
                setSystems(res.data || []);
            } catch {
                setSystems([]);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                    <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
            </div>
        );
    }

    if (systems.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" /> Santé des Systèmes
                </h3>
                <p className="text-sm text-slate-500">Aucun système configuré.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" /> Santé des Systèmes
            </h3>

            <div className="space-y-3">
                {systems.map((sys, idx) => (
                    <div
                        key={sys.systemId}
                        className={`flex items-center gap-4 p-3 rounded-lg ${getScoreBg(sys.score)} transition-all hover:shadow-sm`}
                    >
                        {/* Rank */}
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-5 text-center">
                            #{idx + 1}
                        </span>

                        {/* Score ring */}
                        <ScoreRing score={sys.score} />

                        {/* System info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-slate-900 dark:text-white truncate">
                                    {sys.systemName}
                                </span>
                                <TrendIcon trend={sys.trend} />
                            </div>
                            <div className="flex gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1" title="Incidents ouverts">
                                    <AlertTriangle className="h-3 w-3" />
                                    {sys.openIncidents} ouverts
                                </span>
                                <span className="flex items-center gap-1" title="MTTR moyen">
                                    <Clock className="h-3 w-3" />
                                    {sys.avgMttrMinutes}m
                                </span>
                                <span className="flex items-center gap-1" title="Taux de résolution">
                                    <CheckCircle className="h-3 w-3" />
                                    {Math.round(sys.resolutionRate * 100)}%
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
