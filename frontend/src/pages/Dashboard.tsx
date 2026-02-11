import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { api } from '../lib/api';
import { Activity, CheckCircle, AlertTriangle, Search, Server, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TrendChart, StatusPieChart, SLAGauge } from '../components/DashboardCharts';

interface DashboardStats {
    createdToday: number;
    resolvedToday: number;
    activeIncidents: number;
    avgResolutionTimeMinutes: number;
    trends: Array<{ date: string; created: number; resolved: number }>;
    statusBreakdown: Array<{ status: string; count: number }>;
    topSystems: Array<{
        systemId: string;
        name: string;
        count: number;
    }>;
    myWork?: {
        myTeamQueue: number;
        myTeamBreaches: number;
    };
}

import { useAuth } from '../context/AuthContext';
import { System, Team } from '../types';

const Dashboard = () => {
    const { hasPermission } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);



    // ... existing state ...
    const [period, setPeriod] = useState('month'); // today, week, month
    const [selectedSystem, setSelectedSystem] = useState('');
    const [selectedTeam, setSelectedTeam] = useState('');

    // Options
    const [systems, setSystems] = useState<System[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [sysRes, teamRes] = await Promise.all([
                    api.get('/api/systems'),
                    api.get('/api/teams')
                ]);
                setSystems(sysRes.data);
                setTeams(teamRes.data);
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
                // Calculate Query Params
                const now = new Date();
                const startDate = new Date();
                const endDate = new Date();

                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);

                if (period === 'week') {
                    startDate.setDate(now.getDate() - 7);
                } else if (period === 'month') {
                    startDate.setDate(now.getDate() - 30);
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const params: any = {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                };

                if (selectedSystem) params.systemId = selectedSystem;
                if (selectedTeam) params.teamId = selectedTeam;

                const response = await api.get('/api/incidents/stats', { params });
                setStats(response.data);
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
        // Refresh every minute
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, [period, selectedSystem, selectedTeam]); // Re-fetch when filters change

    // Permission check
    if (!hasPermission('DASHBOARD_VIEW')) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="bg-red-50 p-6 rounded-full mb-4">
                    <ShieldAlert className="h-12 w-12 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Access Denied</h2>
                <p className="text-slate-600 mt-2 max-w-md">
                    You do not have permission to view the dashboard. Please contact your administrator if you believe this is an error.
                </p>
            </div>
        );
    }

    if (loading && !stats) {
        return <div className="p-8">Loading dashboard...</div>;
    }

    if (!stats) {
        return <div className="p-8 text-red-500">Failed to load dashboard data.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Operations Dashboard</h1>
                    <p className="text-muted-foreground">Real-time overview of Dollar Universe components</p>
                </div>
                <div className="flex gap-2">
                    {hasPermission('INCIDENT_CREATE') && (
                        <Link to="/incidents/new" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Declare Incident
                        </Link>
                    )}
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-lg border shadow-sm flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-600">Period:</span>
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="rounded-md border-slate-300 text-sm focus:ring-accent focus:border-accent p-1.5 border"
                    >
                        <option value="today">Today</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-600">Application:</span>
                    <select
                        value={selectedSystem}
                        onChange={(e) => setSelectedSystem(e.target.value)}
                        className="rounded-md border-slate-300 text-sm focus:ring-accent focus:border-accent p-1.5 border min-w-[150px]"
                    >
                        <option value="">All Applications</option>
                        {Array.isArray(systems) && systems.map((s: System) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-600">Team:</span>
                    <select
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                        className="rounded-md border-slate-300 text-sm focus:ring-accent focus:border-accent p-1.5 border min-w-[150px]"
                    >
                        <option value="">All Teams</option>
                        {Array.isArray(teams) && teams.map((t: Team) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Incidents</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.createdToday}</div>
                        <p className="text-xs text-muted-foreground">Opened in this period</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Resolutions</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.resolvedToday}</div>
                        <p className="text-xs text-muted-foreground">Resolved in this period</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeIncidents}</div>
                        <p className="text-xs text-muted-foreground">Currently open (Total)</p>
                    </CardContent>
                </Card>
                <SLAGauge avgResolutionTime={stats.avgResolutionTimeMinutes} />
            </div>

            {/* Visual Analytics Row */}
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7">
                {stats.trends && <TrendChart data={stats.trends} />}
                {stats.statusBreakdown && <StatusPieChart data={stats.statusBreakdown} />}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Top Failing Uprocs/Applications */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Top Failing Applications (In Period)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.topSystems?.map((system) => (
                                <div key={system.systemId} className="flex items-center">
                                    <Server className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <div className="ml-2 space-y-1 flex-1">
                                        <p className="text-sm font-medium leading-none">{system.name}</p>
                                        <p className="text-xs text-muted-foreground">Application / Integration Area</p>
                                    </div>
                                    <div className="ml-auto font-medium">{system.count} incidents</div>
                                </div>
                            ))}
                            {stats.topSystems?.length === 0 && (
                                <p className="text-sm text-muted-foreground">No data available for this period.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions / Recent Activity Placeholder */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>My Workspace</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        {stats.myWork && (
                            <div className="grid grid-cols-2 gap-4">
                                {hasPermission('INCIDENT_VIEW') ? (
                                    <Link to="/incidents?status=Open" className="bg-slate-50 p-3 rounded border border-slate-100 text-center hover:bg-slate-100 transition-colors block">
                                        <div className="text-2xl font-bold text-slate-700">{stats.myWork.myTeamQueue}</div>
                                        <div className="text-xs text-slate-500">Team Queue</div>
                                    </Link>
                                ) : (
                                    <div className="bg-slate-50 p-3 rounded border border-slate-100 text-center block opacity-75 cursor-not-allowed">
                                        <div className="text-2xl font-bold text-slate-700">{stats.myWork.myTeamQueue}</div>
                                        <div className="text-xs text-slate-500">Team Queue</div>
                                    </div>
                                )}
                                <div className="bg-red-50 p-3 rounded border border-red-100 text-center">
                                    <div className="text-2xl font-bold text-red-600">{stats.myWork.myTeamBreaches}</div>
                                    <div className="text-xs text-red-500">SLA Breaches</div>
                                </div>
                            </div>
                        )}
                        {hasPermission('INCIDENT_VIEW') && (
                            <Link to="/incidents?status=Open" className="flex items-center gap-4 rounded-md border p-4 hover:bg-muted/50 transition-colors">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">Open Incidents</p>
                                    <p className="text-xs text-muted-foreground">Jump to active issues</p>
                                </div>
                            </Link>
                        )}
                        {hasPermission('PROCEDURE_VIEW') && (
                            <Link to="/procedures" className="flex items-center gap-4 rounded-md border p-4 hover:bg-muted/50 transition-colors">
                                <Search className="h-5 w-5 text-blue-500" />
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">Find Procedure</p>
                                    <p className="text-xs text-muted-foreground">Search documented solutions</p>
                                </div>
                            </Link>
                        )}
                        {hasPermission('INCIDENT_VIEW') && (
                            <Link to="/incidents" className="flex items-center gap-4 rounded-md border p-4 hover:bg-muted/50 transition-colors">
                                <Activity className="h-5 w-5 text-slate-500" />
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">View All Incidents</p>
                                    <p className="text-xs text-muted-foreground">Browse full history</p>
                                </div>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
