import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Legend,
    BarChart,
    Bar
} from 'recharts';

// --- Trend Chart ---
interface TrendData {
    date: string;
    created: number;
    resolved: number;
}

export const TrendChart = ({ data }: { data: TrendData[] }) => {
    return (
        <div className="bg-white p-4 rounded-lg border shadow-sm col-span-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Incident Trends (Last 7 Days)</h3>
            <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11 }}
                            tickFormatter={(val) => val.split('-').slice(1).join('/')}
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelStyle={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        <Area
                            type="monotone"
                            dataKey="created"
                            name="New Incidents"
                            stroke="#f59e0b"
                            fillOpacity={1}
                            fill="url(#colorCreated)"
                        />
                        <Area
                            type="monotone"
                            dataKey="resolved"
                            name="Resolved"
                            stroke="#10b981"
                            fillOpacity={1}
                            fill="url(#colorResolved)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// --- Status Breakdown ---
interface StatusData {
    status: string;
    count: number;
}

const STATUS_COLORS: Record<string, string> = {
    'Open': '#ef4444',       // Red
    'In Progress': '#f59e0b', // Amber
    'Resolved': '#10b981',    // Emerald
    'Closed': '#64748b'       // Slate
};

export const StatusPieChart = ({ data }: { data: StatusData[] }) => {
    return (
        <div className="bg-white p-4 rounded-lg border shadow-sm col-span-3">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Status Breakdown</h3>
            <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="status"
                            type="category"
                            width={100}
                            tick={{ fontSize: 12, fill: '#64748b' }}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#cbd5e1'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// --- SLA Gauge ---
export const SLAGauge = ({ avgResolutionTime }: { avgResolutionTime: number }) => {
    const isHealthy = avgResolutionTime < 60; // Example threshold
    const displayValue = Math.round(avgResolutionTime || 0);

    return (
        <div className="bg-white p-4 rounded-lg border shadow-sm flex flex-col items-center justify-center">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Avg Resolution Time</h3>
            <div className="relative flex items-center justify-center">
                <div className={`text-3xl font-bold ${isHealthy ? 'text-green-600' : 'text-amber-600'}`}>
                    {displayValue}
                    <span className="text-xs font-normal text-slate-500 ml-1">min</span>
                </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">Target: &lt; 60 min</p>
        </div>
    );
};
