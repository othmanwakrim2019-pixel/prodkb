import { useEffect, useState } from 'react';
import {
    Zap, CheckCircle, AlertTriangle, Search, XCircle,
    ArrowUpRight, RefreshCw, ShieldAlert, Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { TrendChart, StatusDonutChart, TopSystemsChart } from '../components/DashboardCharts';
import { useTranslation } from 'react-i18next';
import { AnimatedNumber, KPICard, PeriodPill } from '../components/DashboardWidgets';
import { SystemHealthWidget } from '../components/SystemHealthWidget';
import { CanAccess } from '../../../components/CanAccess';
import { APP_PATHS } from '../../../app/route-meta';
import { incidentService } from '../../incidents/api/incident.service';
import { systemService, teamService } from '../../admin/api/admin.service';

interface DashboardStats {
    createdToday: number;
    resolvedToday: number;
    closedCount: number;
    activeIncidents: number;
    avgResolutionTimeMinutes: number;
    trends: Array<{ date: string; created: number; resolved: number }>;
    statusBreakdown: Array<{ status: string; count: number }>;
    topSystems: Array<{ systemId: string; name: string; count: number }>;
    myWork?: {
        myTeamQueue: number;
        myTeamBreaches: number;
    };
}

import { useAuth } from '../../../context/AuthContext';
import { System, Team } from '../../../types';

const DashboardPage = () => {
    const { hasPermission } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();

    const [period, setPeriod] = useState('month');
    const [selectedSystem, setSelectedSystem] = useState('');
    const [selectedTeam, setSelectedTeam] = useState('');
    const [systems, setSystems] = useState<System[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [nextSystems, nextTeams] = await Promise.all([
                    systemService.getAll(),
                    teamService.getAll(),
                ]);
                setSystems(Array.isArray(nextSystems) ? nextSystems : []);
                setTeams(Array.isArray(nextTeams) ? nextTeams : []);
            } catch (error) {
                console.error('Failed to fetch filter options:', error);
            }
        };
        fetchFilters();
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const now = new Date();
                const startDate = new Date();
                const endDate = new Date();
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
                if (period === 'week') startDate.setDate(now.getDate() - 7);
                else if (period === 'month') startDate.setDate(now.getDate() - 30);

                const params: Record<string, string> = {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                };
                if (selectedSystem) params.systemId = selectedSystem;
                if (selectedTeam) params.teamId = selectedTeam;

                const data = await incidentService.getStats(params);
                setStats(data as DashboardStats);
                setLastRefresh(new Date());
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, [period, selectedSystem, selectedTeam]);

    // ── Permission check ──
    if (!hasPermission('DASHBOARD_VIEW')) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="bg-red-50 p-6 rounded-full mb-4">
                    <ShieldAlert className="h-12 w-12 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{t('common.accessDenied')}</h2>
                <p className="text-slate-600 mt-2 max-w-md">{t('common.accessDeniedMessage')}</p>
            </div>
        );
    }

    // ── Loading skeleton ──
    if (loading && !stats) {
        return (
            <div className="space-y-6 p-2">
                <div className="h-10 w-72 animate-shimmer rounded-xl" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 rounded-2xl animate-shimmer" style={{ animationDelay: `${i * 0.1}s` }} />
                    ))}
                </div>
                <div className="grid gap-4 lg:grid-cols-8">
                    <div className="col-span-5 h-72 rounded-2xl animate-shimmer" />
                    <div className="col-span-3 h-72 rounded-2xl animate-shimmer" />
                </div>
            </div>
        );
    }

    if (!stats) {
        return <div className="p-8 text-red-500">{t('dashboard.failedToLoad')}</div>;
    }

    return (
        <div className="space-y-6">
            {/* ═══ HEADER ═══ */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                        {t('dashboard.title')}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-slate-500">{t('dashboard.subtitle')}</p>
                        <span className="relative flex h-2 w-2">
                            <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span className="text-[10px] text-slate-400">
                            {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <CanAccess permission="INCIDENT_CREATE">
                        <Link
                            to={APP_PATHS.incidentNew}
                            className="bg-gradient-to-r from-primary to-blue-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 flex items-center gap-2 font-medium text-sm"
                        >
                            <AlertTriangle className="h-4 w-4" />
                            {t('dashboard.declareIncident')}
                        </Link>
                    </CanAccess>
                </div>
            </div>

            {/* ═══ FILTER BAR ═══ */}
            <div className="glass rounded-2xl p-4 flex flex-wrap gap-4 items-center">
                {/* Period pills */}
                <div className="flex gap-1.5">
                    <PeriodPill label={t('dashboard.today')} active={period === 'today'} onClick={() => setPeriod('today')} />
                    <PeriodPill label={t('dashboard.last7Days')} active={period === 'week'} onClick={() => setPeriod('week')} />
                    <PeriodPill label={t('dashboard.last30Days')} active={period === 'month'} onClick={() => setPeriod('month')} />
                </div>

                <div className="w-px h-6 bg-slate-200 mx-1 hidden md:block" />

                {/* System filter */}
                <select
                    value={selectedSystem}
                    onChange={(e) => setSelectedSystem(e.target.value)}
                    className="rounded-xl border-slate-200 text-sm focus:ring-primary/30 focus:border-primary p-2 border bg-white/80 min-w-[160px]"
                >
                    <option value="">{t('dashboard.allApplications')}</option>
                    {Array.isArray(systems) && systems.map((s: System) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>

                {/* Team filter */}
                <select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="rounded-xl border-slate-200 text-sm focus:ring-primary/30 focus:border-primary p-2 border bg-white/80 min-w-[160px]"
                >
                    <option value="">{t('dashboard.allTeams')}</option>
                    {Array.isArray(teams) && teams.map((tm: Team) => (
                        <option key={tm.id} value={tm.id}>{tm.name}</option>
                    ))}
                </select>

                {/* Refresh indicator */}
                <div className="ml-auto flex items-center gap-1.5 text-slate-400">
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span className="text-xs">Auto-refresh 1m</span>
                </div>
            </div>

            {/* ═══ KPI CARDS ═══ */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title={t('dashboard.incidents')}
                    value={stats.createdToday}
                    subtitle={t('dashboard.openedInPeriod')}
                    gradient="kpi-gradient-blue"
                    icon={<Zap className="h-4 w-4 text-white" />}
                    trend={stats.createdToday > 0 ? 'up' : 'neutral'}
                    delay="0s"
                />
                <KPICard
                    title={t('dashboard.resolutions')}
                    value={stats.resolvedToday}
                    subtitle={t('dashboard.resolvedInPeriod')}
                    gradient="kpi-gradient-emerald"
                    icon={<CheckCircle className="h-4 w-4 text-white" />}
                    trend={stats.resolvedToday > 0 ? 'up' : 'neutral'}
                    delay="0.06s"
                />
                <KPICard
                    title={t('dashboard.activeIncidents')}
                    value={stats.activeIncidents}
                    subtitle={t('dashboard.currentlyOpen')}
                    gradient="kpi-gradient-amber"
                    icon={<AlertTriangle className="h-4 w-4 text-white" />}
                    trend={stats.activeIncidents > 5 ? 'up' : 'down'}
                    delay="0.12s"
                />
                <KPICard
                    title={t('dashboard.closedIncidents')}
                    value={stats.closedCount}
                    subtitle={t('dashboard.closedInPeriod')}
                    gradient="kpi-gradient-violet"
                    icon={<XCircle className="h-4 w-4 text-white" />}
                    trend={stats.closedCount > 0 ? 'up' : 'neutral'}
                    delay="0.18s"
                />
            </div>

            {/* ═══ CHARTS ROW ═══ */}
            <div className="grid gap-4 lg:grid-cols-8">
                {stats.trends && <TrendChart data={stats.trends} />}
                {stats.statusBreakdown && <StatusDonutChart data={stats.statusBreakdown} />}
            </div>

            {/* ═══ BOTTOM ROW ═══ */}
            <div className="grid gap-4 lg:grid-cols-8">
                {/* Top Failing Systems */}
                <TopSystemsChart
                    systems={stats.topSystems || []}
                    noDataLabel={t('dashboard.noDataPeriod')}
                />

                {/* Command Center */}
                <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-100 shadow-sm col-span-3 animate-fade-up">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-4 rounded-full bg-gradient-to-b from-primary to-blue-400" />
                        {t('dashboard.myWorkspace')}
                    </h3>

                    {/* Team stats */}
                    {stats.myWork && (
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <CanAccess permission="INCIDENT_VIEW">
                                <Link
                                    to="/incidents?status=Open"
                                    className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-100 text-center hover:shadow-md hover:scale-[1.02] transition-all duration-200 group/stat"
                                >
                                    <div className="text-2xl font-bold text-slate-700 group-hover/stat:text-primary transition-colors">
                                        <AnimatedNumber value={stats.myWork.myTeamQueue} />
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-0.5 font-medium">{t('dashboard.teamQueue')}</div>
                                </Link>
                            </CanAccess>
                            <div className="bg-gradient-to-br from-red-50 to-red-100/50 p-4 rounded-xl border border-red-100 text-center">
                                <div className="text-2xl font-bold text-red-600">
                                    <AnimatedNumber value={stats.myWork.myTeamBreaches} />
                                </div>
                                <div className="text-[11px] text-red-500 mt-0.5 font-medium">{t('dashboard.slaBreaches')}</div>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="space-y-2">
                        <CanAccess permission="INCIDENT_VIEW">
                            <Link
                                to={`${APP_PATHS.incidents}?status=Open`}
                                className="flex items-center gap-3 rounded-xl border border-slate-100 p-3.5 hover:bg-gradient-to-r hover:from-red-50 hover:to-transparent hover:border-red-100 transition-all duration-200 group/link"
                            >
                                <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center group-hover/link:bg-red-100 transition-colors">
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-700">{t('dashboard.openIncidents')}</p>
                                    <p className="text-[11px] text-slate-400">{t('dashboard.jumpToActive')}</p>
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover/link:text-red-400 transition-colors" />
                            </Link>
                        </CanAccess>
                        <CanAccess permission="PROCEDURE_VIEW">
                            <Link
                                to={APP_PATHS.procedures}
                                className="flex items-center gap-3 rounded-xl border border-slate-100 p-3.5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent hover:border-blue-100 transition-all duration-200 group/link"
                            >
                                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center group-hover/link:bg-blue-100 transition-colors">
                                    <Search className="h-4 w-4 text-blue-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-700">{t('dashboard.findProcedure')}</p>
                                    <p className="text-[11px] text-slate-400">{t('dashboard.searchSolutions')}</p>
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover/link:text-blue-400 transition-colors" />
                            </Link>
                        </CanAccess>
                        <CanAccess permission="INCIDENT_VIEW">
                            <Link
                                to={APP_PATHS.incidents}
                                className="flex items-center gap-3 rounded-xl border border-slate-100 p-3.5 hover:bg-gradient-to-r hover:from-slate-50 hover:to-transparent transition-all duration-200 group/link"
                            >
                                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center group-hover/link:bg-slate-200 transition-colors">
                                    <Activity className="h-4 w-4 text-slate-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-700">{t('dashboard.viewAllIncidents')}</p>
                                    <p className="text-[11px] text-slate-400">{t('dashboard.browseHistory')}</p>
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover/link:text-slate-500 transition-colors" />
                            </Link>
                        </CanAccess>
                    </div>
                </div>
            </div>

            {/* ═══ SYSTEM HEALTH ═══ */}
            <div className="grid gap-4 lg:grid-cols-2">
                <SystemHealthWidget />
            </div>
        </div>
    );
};

export default DashboardPage;


