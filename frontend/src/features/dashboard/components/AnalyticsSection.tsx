/**
 * AnalyticsSection — wires up the real analytics API endpoints into
 * a premium KPI row + MTTR trend + severity bar + team performance table.
 * Mounted inside DashboardPage below the existing charts.
 */
import { useEffect, useState, useCallback } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell,
} from 'recharts';
import { TrendingUp, ShieldCheck, AlertOctagon, Clock, Users } from 'lucide-react';
import api from '../../../utils/axios';

// ── Types ──────────────────────────────────────────────────────────────────
interface SLACompliance { total: number; withinSLA: number; breached: number; complianceRate: number; }
interface MTTRPoint      { date: string; avgMinutes: number; count: number; }
interface SeverityDist   { severity: string; count: number; percentage: number; }
interface TeamPerf        { teamId: string; teamName: string; totalIncidents: number; avgTimeToResolve: number; slaBreachCount: number; breachRate: number; }

interface AnalyticsData {
    sla: SLACompliance | null;
    mttr: MTTRPoint[];
    severity: SeverityDist[];
    teams: TeamPerf[];
}

// ── Colors ─────────────────────────────────────────────────────────────────
const SEV_COLORS: Record<string, string> = {
    Critical: '#ef4444',
    High:     '#f97316',
    Medium:   '#eab308',
    Low:      '#22c55e',
    Info:     '#3b82f6',
};

// ── Mini stat pill for KPI cards ───────────────────────────────────────────
const StatPill = ({
    icon, label, value, sub, accent, loading,
}: { icon: React.ReactNode; label: string; value: string; sub?: string; accent: string; loading: boolean }) => (
    <div className="ent-card p-4 flex items-center gap-4 animate-fade-up">
        <div className="flex-shrink-0 h-10 w-10 rounded flex items-center justify-center" style={{ background: `${accent}18` }}>
            <span style={{ color: accent }}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
            {loading ? (
                <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mt-1" />
            ) : (
                <p className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">{value}</p>
            )}
            {sub && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{sub}</p>}
        </div>
    </div>
);

// ── Custom bar tooltip ─────────────────────────────────────────────────────
const BarTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 shadow-lg text-xs">
            <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
            {payload.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: p.fill || p.color }} />
                    <span className="text-slate-500">{p.name}:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{p.value}</span>
                </div>
            ))}
        </div>
    );
};

// ── Main Component ─────────────────────────────────────────────────────────
export const AnalyticsSection = ({ days = 30 }: { days?: number }) => {
    const [data, setData] = useState<AnalyticsData>({ sla: null, mttr: [], severity: [], teams: [] });
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [slaRes, mttrRes, sevRes, teamRes] = await Promise.allSettled([
                api.get(`/api/v1/analytics/sla-compliance?days=${days}`),
                api.get(`/api/v1/analytics/mttr?days=${days}`),
                api.get(`/api/v1/analytics/severity?days=${days}`),
                api.get(`/api/v1/analytics/team-performance?days=${days}`),
            ]);

            setData({
                sla:      slaRes.status  === 'fulfilled' ? slaRes.value.data?.data  ?? slaRes.value.data  : null,
                mttr:     mttrRes.status === 'fulfilled' ? mttrRes.value.data?.data ?? mttrRes.value.data ?? [] : [],
                severity: sevRes.status  === 'fulfilled' ? sevRes.value.data?.data  ?? sevRes.value.data  ?? [] : [],
                teams:    teamRes.status === 'fulfilled' ? teamRes.value.data?.data  ?? teamRes.value.data ?? [] : [],
            });
        } catch (_) { /* silently ignore — dashboard degrades gracefully */ }
        finally { setLoading(false); }
    }, [days]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const avgMTTR = data.mttr.length
        ? Math.round(data.mttr.reduce((s, d) => s + d.avgMinutes, 0) / data.mttr.length)
        : 0;

    // Format MTTR data for bar chart (last 14 points max for readability)
    const mttrChartData = [...data.mttr]
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-14)
        .map(d => ({ date: d.date.slice(5), mins: d.avgMinutes, incidents: d.count }));

    return (
        <div className="space-y-4">

            {/* ── Section heading ─────────────────────────── */}
            <div className="flex items-center gap-2 pt-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Analytics &amp; Performance
                </h2>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">Last {days} days</span>
            </div>

            {/* ── KPI row ─────────────────────────────────── */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatPill
                    icon={<ShieldCheck className="h-5 w-5" />}
                    label="SLA Compliance"
                    value={data.sla ? `${data.sla.complianceRate}%` : '—'}
                    sub={data.sla ? `${data.sla.withinSLA} / ${data.sla.total} within SLA` : undefined}
                    accent="#003d82"
                    loading={loading}
                />
                <StatPill
                    icon={<AlertOctagon className="h-5 w-5" />}
                    label="SLA Breaches"
                    value={data.sla ? String(data.sla.breached) : '—'}
                    sub={data.sla && data.sla.total > 0 ? `${(100 - data.sla.complianceRate).toFixed(1)}% breach rate` : undefined}
                    accent="#ef4444"
                    loading={loading}
                />
                <StatPill
                    icon={<Clock className="h-5 w-5" />}
                    label="Avg MTTR"
                    value={avgMTTR ? (avgMTTR >= 60 ? `${Math.floor(avgMTTR / 60)}h ${avgMTTR % 60}m` : `${avgMTTR} min`) : '—'}
                    sub="Mean time to resolve"
                    accent="#f97316"
                    loading={loading}
                />
                <StatPill
                    icon={<Users className="h-5 w-5" />}
                    label="Teams Tracked"
                    value={String(data.teams.length)}
                    sub={data.teams[0] ? `Best: ${data.teams.slice().sort((a,b) => a.avgTimeToResolve - b.avgTimeToResolve)[0]?.teamName}` : undefined}
                    accent="#8b5cf6"
                    loading={loading}
                />
            </div>

            {/* ── Charts row ──────────────────────────────── */}
            <div className="grid gap-4 lg:grid-cols-8">

                {/* MTTR bar chart */}
                <div className="ent-card p-4 col-span-5 animate-fade-up animate-delay-1">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            MTTR Trend <span className="text-[11px] font-normal text-slate-400 ml-1">(avg minutes per day)</span>
                        </h3>
                    </div>
                    {loading ? (
                        <div className="h-48 bg-slate-50 dark:bg-slate-800 rounded animate-pulse" />
                    ) : mttrChartData.length === 0 ? (
                        <div className="h-48 flex items-center justify-center text-sm text-slate-400 italic">
                            No resolved incidents in this period
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={mttrChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} unit=" min" />
                                <Tooltip content={<BarTooltip />} />
                                <Bar dataKey="mins" name="Avg MTTR" radius={[3, 3, 0, 0]} maxBarSize={28}>
                                    {mttrChartData.map((_, i) => (
                                        <Cell key={i} fill={_ .mins > 120 ? '#ef4444' : _.mins > 60 ? '#f97316' : '#003d82'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                    {/* Legend */}
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm inline-block bg-[#003d82]" /> &lt; 60 min (good)</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm inline-block bg-[#f97316]" /> 60–120 min</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm inline-block bg-[#ef4444]" /> &gt; 120 min (critical)</span>
                    </div>
                </div>

                {/* Severity distribution */}
                <div className="ent-card p-4 col-span-3 animate-fade-up animate-delay-2">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                        Severity Distribution
                    </h3>
                    {loading ? (
                        <div className="space-y-3">
                            {[1,2,3,4].map(i => <div key={i} className="h-8 bg-slate-50 dark:bg-slate-800 rounded animate-pulse" />)}
                        </div>
                    ) : data.severity.length === 0 ? (
                        <p className="text-sm text-slate-400 italic text-center py-8">No data</p>
                    ) : (
                        <div className="space-y-3">
                            {data.severity
                                .sort((a, b) => b.count - a.count)
                                .map(sev => (
                                    <div key={sev.severity}>
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">{sev.severity}</span>
                                            <span className="text-slate-500 dark:text-slate-400">
                                                {sev.count} <span className="text-slate-400">({sev.percentage}%)</span>
                                            </span>
                                        </div>
                                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full animate-bar-fill transition-all"
                                                style={{
                                                    width: `${sev.percentage}%`,
                                                    background: SEV_COLORS[sev.severity] || '#64748b',
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Team performance table ───────────────────── */}
            {(loading || data.teams.length > 0) && (
                <div className="ent-card overflow-hidden animate-fade-up animate-delay-3">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-400" />
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Team Performance</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                            <thead className="bg-slate-50 dark:bg-slate-800/50">
                                <tr>
                                    {['Team', 'Incidents', 'Avg MTTR', 'SLA Breaches', 'Breach Rate'].map(h => (
                                        <th key={h} className="ent-th">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? [...Array(3)].map((_, i) => (
                                    <tr key={i}>
                                        {[...Array(5)].map((__, j) => (
                                            <td key={j} className="px-4 py-3">
                                                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                                            </td>
                                        ))}
                                    </tr>
                                )) : data.teams.map(team => (
                                    <tr key={team.teamId} className="ent-tr">
                                        <td className="px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                                            {team.teamName}
                                        </td>
                                        <td className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300">
                                            {team.totalIncidents}
                                        </td>
                                        <td className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300">
                                            {team.avgTimeToResolve >= 60
                                                ? `${Math.floor(team.avgTimeToResolve / 60)}h ${team.avgTimeToResolve % 60}m`
                                                : `${team.avgTimeToResolve} min`}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span className={`ent-lozenge ${team.slaBreachCount > 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                                                {team.slaBreachCount}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden max-w-[60px]">
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{
                                                            width: `${team.breachRate}%`,
                                                            background: team.breachRate > 30 ? '#ef4444' : team.breachRate > 10 ? '#f97316' : '#22c55e',
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                                    {team.breachRate}%
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyticsSection;
