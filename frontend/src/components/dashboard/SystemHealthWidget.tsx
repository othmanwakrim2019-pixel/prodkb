import { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import { TrendingUp, TrendingDown, Minus, Activity, AlertTriangle, Clock, CheckCircle, Info } from 'lucide-react';

interface SystemHealth {
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
    if (score >= 80) return 'Bon';
    if (score >= 60) return 'À surveiller';
    if (score >= 40) return 'Dégradé';
    return 'Critique';
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
    const [showLegend, setShowLegend] = useState(false);

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
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" /> Santé des Systèmes
                </h3>
                <button
                    onClick={() => setShowLegend(!showLegend)}
                    className="text-slate-400 hover:text-blue-500 transition-colors"
                    title="Comment lire ce tableau"
                >
                    <Info className="h-5 w-5" />
                </button>
            </div>

            {/* Subtitle */}
            <p className="text-xs text-slate-400 mb-4">
                Score de santé basé sur : incidents ouverts, taux de résolution, respect SLA et temps de résolution moyen (30 jours)
            </p>

            {/* Legend */}
            {showLegend && (
                <div className="mb-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                    <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">Comment est calculé le score ?</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <span>🔴 <b>Incidents ouverts</b> — 35%</span>
                        <span>✅ <b>Taux résolution</b> — 25%</span>
                        <span>⏱ <b>Respect SLA</b> — 20%</span>
                        <span>🕐 <b>Temps résolution</b> — 20%</span>
                    </div>
                    <hr className="border-slate-200 dark:border-slate-600 my-1.5" />
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> 80–100 Bon</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 60–79 À surveiller</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> 0–59 Critique</span>
                    </div>
                </div>
            )}

            {/* System list */}
            <div className="space-y-2.5">
                {systems.map((sys, idx) => (
                    <div
                        key={sys.systemId}
                        className={`flex items-center gap-4 p-3 rounded-lg border ${getScoreBg(sys.score)} transition-all hover:shadow-sm`}
                    >
                        {/* Rank */}
                        <span className="text-xs font-bold text-slate-400 w-5 text-center">
                            #{idx + 1}
                        </span>

                        {/* Score ring */}
                        <ScoreRing score={sys.score} />

                        {/* System info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                                    {sys.systemName}
                                </span>
                                <TrendIcon trend={sys.trend} />
                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${sys.score >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                                        sys.score >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                                            'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                    }`}>
                                    {getScoreLabel(sys.score)}
                                </span>
                            </div>
                            <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1" title="Incidents actuellement ouverts">
                                    <AlertTriangle className={`h-3 w-3 ${sys.openIncidents > 0 ? 'text-red-500' : 'text-emerald-500'}`} />
                                    <b>{sys.openIncidents}</b> ouverts
                                </span>
                                <span className="flex items-center gap-1" title="Temps moyen de résolution (30 jours)">
                                    <Clock className="h-3 w-3" />
                                    MTTR {sys.avgMttrMinutes > 0 ? `${sys.avgMttrMinutes}m` : '—'}
                                </span>
                                <span className="flex items-center gap-1" title={`${sys.resolvedIncidents30d} résolus sur ${sys.totalIncidents30d} incidents (30 jours)`}>
                                    <CheckCircle className={`h-3 w-3 ${sys.resolutionRate >= 0.8 ? 'text-emerald-500' : sys.resolutionRate >= 0.5 ? 'text-amber-500' : 'text-red-500'}`} />
                                    Résolu {sys.resolvedIncidents30d}/{sys.totalIncidents30d}
                                    <span className="text-slate-400">
                                        ({Math.round(sys.resolutionRate * 100)}%)
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
