import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import { useTranslation } from 'react-i18next';

// ════════════════════════════════════════════════════
//  TREND CHART  –  Smooth area with glassmorphism tooltip
// ════════════════════════════════════════════════════
interface TrendData {
    date: string;
    created: number;
    resolved: number;
}

interface TooltipPayloadEntry {
    name: string;
    value: number;
    color: string;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadEntry[];
    label?: string;
}

interface PieLabelProps {
    cx?: number;
    cy?: number;
    midAngle?: number;
    innerRadius?: number;
    outerRadius?: number;
    percent?: number;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="glass rounded-lg px-4 py-3 shadow-xl border border-white/30">
            <p className="text-xs font-semibold text-slate-600 mb-1.5">
                {label?.split('-').slice(1).join('/')}
            </p>
            {payload.map((entry: TooltipPayloadEntry, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
                    <span className="text-slate-500">{entry.name}:</span>
                    <span className="font-bold text-slate-800">{entry.value}</span>
                </div>
            ))}
        </div>
    );
};

export const TrendChart = ({ data }: { data: TrendData[] }) => {
    const { t } = useTranslation();

    return (
        <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-100 shadow-sm col-span-5 animate-fade-up animate-delay-2">
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-slate-700">{t('dashboard.incidentTrends')}</h3>
                <div className="flex gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
                        {t('dashboard.incidents')}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" />
                        {t('dashboard.resolutions')}
                    </span>
                </div>
            </div>
            <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
                                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                            </linearGradient>
                            <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                                <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            tickLine={false}
                            axisLine={{ stroke: '#e2e8f0' }}
                            tickFormatter={(val) => val.split('-').slice(1).join('/')}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="created"
                            name={t('dashboard.incidents')}
                            stroke="#f59e0b"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#gradCreated)"
                            dot={false}
                            activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: '#f59e0b' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="resolved"
                            name={t('dashboard.resolutions')}
                            stroke="#10b981"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#gradResolved)"
                            dot={false}
                            activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: '#10b981' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// ════════════════════════════════════════════════════
//  STATUS DONUT CHART
// ════════════════════════════════════════════════════
interface StatusData {
    status: string;
    count: number;
}

const STATUS_COLORS: Record<string, string> = {
    'Open': '#ef4444',
    'In Progress': '#f59e0b',
    'Acknowledged': '#3b82f6',
    'Resolved': '#10b981',
    'Closed': '#64748b',
};

const renderLabel = ({ cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 }: PieLabelProps) => {
    if (percent < 0.08) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
            style={{ fontSize: 12, fontWeight: 700 }}>
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export const StatusDonutChart = ({ data }: { data: StatusData[] }) => {
    const { t } = useTranslation();
    const total = data.reduce((sum, d) => sum + d.count, 0);

    return (
        <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-100 shadow-sm col-span-3 animate-fade-up animate-delay-3">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">{t('dashboard.incidentsByStatus')}</h3>
            <div style={{ width: '100%', height: 260 }} className="relative">
                <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={95}
                            paddingAngle={3}
                            dataKey="count"
                            nameKey="status"
                            labelLine={false}
                            label={renderLabel}
                            strokeWidth={0}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#cbd5e1'} />
                            ))}
                        </Pie>
                        <Legend
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: '12px',
                                border: 'none',
                                boxShadow: '0 8px 30px rgb(0 0 0 / 0.08)',
                                background: 'rgba(255,255,255,0.9)',
                                backdropFilter: 'blur(8px)',
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginTop: '-14px' }}>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-slate-800 animate-counter">{total}</div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Total</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ════════════════════════════════════════════════════
//  SLA CIRCULAR GAUGE
// ════════════════════════════════════════════════════
export const SLAGauge = ({ avgResolutionTime }: { avgResolutionTime: number }) => {
    const { t } = useTranslation();
    const target = 60; // minutes
    const displayValue = Math.round(avgResolutionTime || 0);
    const percent = Math.min(displayValue / target, 1);
    const isHealthy = displayValue <= target;

    // SVG circular arc
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - percent);
    const gradientColor = isHealthy ? ['#10b981', '#059669'] : ['#f59e0b', '#d97706'];

    return (
        <div className="relative group">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col items-center justify-center hover:shadow-md transition-all duration-300">
                <h3 className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">
                    {t('dashboard.avgResolution')}
                </h3>
                <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                        {/* Background track */}
                        <circle cx="48" cy="48" r={radius} stroke="#e2e8f0" strokeWidth="6" fill="none" />
                        {/* Animated arc */}
                        <defs>
                            <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor={gradientColor[0]} />
                                <stop offset="100%" stopColor={gradientColor[1]} />
                            </linearGradient>
                        </defs>
                        <circle
                            cx="48" cy="48" r={radius}
                            stroke="url(#gaugeGrad)" strokeWidth="6" fill="none"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className="animate-arc"
                            style={{ '--arc-length': circumference } as React.CSSProperties}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <span className={`text-xl font-bold ${isHealthy ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {displayValue}
                            </span>
                            <span className="text-[10px] text-slate-400 block">min</span>
                        </div>
                    </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                    Target: &lt; {target} min
                </p>
            </div>
        </div>
    );
};

// ════════════════════════════════════════════════════
//  TOP FAILING SYSTEMS  –  Progress bar visualization
// ════════════════════════════════════════════════════
interface TopSystem {
    systemId: string;
    name: string;
    count: number;
}

export const TopSystemsChart = ({ systems, noDataLabel }: { systems: TopSystem[]; noDataLabel: string }) => {
    const { t } = useTranslation();
    const maxCount = Math.max(...systems.map(s => s.count), 1);

    return (
        <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-100 shadow-sm col-span-5 animate-fade-up">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">{t('dashboard.topFailing')}</h3>
            {systems.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">{noDataLabel}</p>
            ) : (
                <div className="space-y-3">
                    {systems.map((system, idx) => {
                        const widthPercent = (system.count / maxCount) * 100;
                        return (
                            <div key={system.systemId} className="group/item">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-slate-700 truncate max-w-[70%]">
                                        {system.name}
                                    </span>
                                    <span className="text-sm font-bold text-slate-800">
                                        {system.count}
                                        <span className="text-xs font-normal text-slate-400 ml-1">
                                            {t('dashboard.nIncidents')}
                                        </span>
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full animate-bar-fill group-hover/item:brightness-110 transition-all"
                                        style={{
                                            width: `${widthPercent}%`,
                                            background: idx === 0
                                                ? 'linear-gradient(90deg, #ef4444, #f87171)'
                                                : idx === 1
                                                    ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                                                    : 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                                            animationDelay: `${idx * 0.1}s`,
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
