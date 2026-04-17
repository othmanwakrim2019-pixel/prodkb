import { useState, useEffect, useCallback } from 'react';
import { Filter, Clock, User, Shield, Download, Search, ChevronDown, ChevronRight, Calendar, Activity } from 'lucide-react';
import { format, isValid, parseISO, subDays, startOfDay, endOfDay } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Pagination } from '../../../components/ui/Pagination';
import { exportToCSV } from '../../../utils/exportCSV';
import { auditService, type AuditLog } from '../api/admin.service';

const safeFormat = (dateStr: string | null | undefined, fmt: string) => {
    if (!dateStr) return '—';
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    return isValid(d) ? format(d, fmt) : '—';
};

const ACTION_LOZENGE: Record<string, string> = {
    DELETE: 'bg-red-600 text-white',
    CREATE: 'bg-emerald-600 text-white',
    UPDATE: 'bg-blue-600 text-white',
    LOGIN:  'bg-slate-500 text-white',
    LOGOUT: 'bg-slate-400 text-white',
    EXPORT: 'bg-amber-500 text-white',
};

const ENTITY_ICON: Record<string, string> = {
    USER: '👤',
    INCIDENT: '🚨',
    ROLE: '🔑',
    SYSTEM: '🖥️',
    TEAM: '👥',
    PROCEDURE: '📋',
    SLA: '⏱️',
};

const QUICK_RANGES = [
    { label: 'Today', days: 0 },
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
];

export const AuditLogsPage = () => {
    const [logs, setLogs]             = useState<AuditLog[]>([]);
    const [loading, setLoading]       = useState(true);
    const [actionType, setActionType] = useState('');
    const [entityType, setEntityType] = useState('');
    const [search, setSearch]         = useState('');
    const [startDate, setStartDate]   = useState('');
    const [endDate, setEndDate]       = useState('');
    const [page, setPage]             = useState(1);
    const [limit, setLimit]           = useState(20);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [viewMode, setViewMode]     = useState<'table' | 'timeline'>('table');
    const { t } = useTranslation();

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params: { action?: string; entityType?: string } = {};
            if (actionType) params.action = actionType;
            if (entityType) params.entityType = entityType;
            const nextLogs = await auditService.getAll(params);
            setLogs(Array.isArray(nextLogs) ? nextLogs : []);
        } catch (error) {
            console.error('Failed to fetch audit logs', error);
        } finally {
            setLoading(false);
        }
    }, [actionType, entityType]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);
    useEffect(() => { setPage(1); }, [search, actionType, entityType, limit, startDate, endDate]);

    const applyQuickRange = (days: number) => {
        if (days === 0) {
            setStartDate(format(startOfDay(new Date()), 'yyyy-MM-dd'));
            setEndDate(format(endOfDay(new Date()), 'yyyy-MM-dd'));
        } else {
            setStartDate(format(subDays(new Date(), days), 'yyyy-MM-dd'));
            setEndDate(format(new Date(), 'yyyy-MM-dd'));
        }
    };

    const filtered = logs.filter(l => {
        const matchesSearch = !search ||
            l.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
            l.actionType?.toLowerCase().includes(search.toLowerCase()) ||
            l.entityType?.toLowerCase().includes(search.toLowerCase()) ||
            l.details?.toLowerCase().includes(search.toLowerCase());

        const logDate = new Date(l.timestamp || l.createdAt || '');
        const matchesStart = !startDate || logDate >= new Date(startDate);
        const matchesEnd   = !endDate   || logDate <= new Date(endDate + 'T23:59:59');

        return matchesSearch && matchesStart && matchesEnd;
    });

    const totalPages = Math.ceil(filtered.length / limit);
    const paged = filtered.slice((page - 1) * limit, page * limit);

    const hasFilters = Boolean(search || actionType || entityType || startDate || endDate);

    return (
        <div className="space-y-4">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-3">
                <div>
                    <h1 className="text-base font-semibold text-slate-900 dark:text-white">{t('admin.auditLogs.title')}</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('admin.auditLogs.subtitle')}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* View toggle */}
                    <div className="flex rounded border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${viewMode === 'table' ? 'bg-primary text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <Filter className="h-3.5 w-3.5" /> Table
                        </button>
                        <button
                            onClick={() => setViewMode('timeline')}
                            className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${viewMode === 'timeline' ? 'bg-primary text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <Activity className="h-3.5 w-3.5" /> Timeline
                        </button>
                    </div>

                    <button
                        onClick={() => exportToCSV(Array.isArray(logs) ? logs : [], 'audit_logs', [
                            { key: 'createdAt', label: 'Timestamp' },
                            { key: 'actionType', label: 'Action' },
                            { key: 'entityType', label: 'Entity' },
                            { key: 'entityId', label: 'Entity ID' },
                            { key: 'details', label: 'Details' },
                        ])}
                        className="ent-btn-secondary whitespace-nowrap"
                        type="button"
                    >
                        <Download className="h-4 w-4" />
                        {t('common.exportCSV')}
                    </button>
                </div>
            </div>

            {/* ── Filter bar ── */}
            <div className="ent-card p-3 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[160px]">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by user, action, entity..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="ent-input pl-8"
                        />
                    </div>
                    {/* Action filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                        <select className="ent-input py-1.5" value={actionType} onChange={e => setActionType(e.target.value)}>
                            <option value="">{t('admin.auditLogs.allActions')}</option>
                            <option value="LOGIN">LOGIN</option>
                            <option value="CREATE">CREATE</option>
                            <option value="UPDATE">UPDATE</option>
                            <option value="DELETE">DELETE</option>
                        </select>
                    </div>
                    {/* Entity filter */}
                    <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                        <select className="ent-input py-1.5" value={entityType} onChange={e => setEntityType(e.target.value)}>
                            <option value="">{t('admin.auditLogs.allEntities')}</option>
                            <option value="USER">{t('common.user')}</option>
                            <option value="INCIDENT">{t('incidents.title')}</option>
                            <option value="ROLE">{t('common.role')}</option>
                            <option value="SYSTEM">{t('common.system')}</option>
                            <option value="TEAM">Team</option>
                            <option value="PROCEDURE">Procedure</option>
                            <option value="SLA">SLA</option>
                        </select>
                    </div>
                    {hasFilters && (
                        <button
                            onClick={() => { setSearch(''); setActionType(''); setEntityType(''); setStartDate(''); setEndDate(''); }}
                            className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium whitespace-nowrap"
                        >
                            ✕ Clear all
                        </button>
                    )}
                </div>

                {/* Date range row */}
                <div className="flex flex-wrap items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    {QUICK_RANGES.map(r => (
                        <button
                            key={r.label}
                            onClick={() => applyQuickRange(r.days)}
                            className="text-xs px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-primary hover:text-primary transition-colors"
                        >
                            {r.label}
                        </button>
                    ))}
                    <div className="flex items-center gap-2 ml-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="ent-input py-1 text-xs"
                            placeholder="From"
                        />
                        <span className="text-slate-400 text-xs">→</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="ent-input py-1 text-xs"
                            placeholder="To"
                        />
                    </div>
                    {(startDate || endDate) && (
                        <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-xs text-slate-400 hover:text-slate-600">Clear dates</button>
                    )}
                </div>
            </div>

            {/* ── Stats bar ── */}
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span><strong className="text-slate-700 dark:text-slate-300">{filtered.length}</strong> results {hasFilters ? '(filtered)' : ''}</span>
                {['CREATE', 'UPDATE', 'DELETE', 'LOGIN'].map(action => {
                    const count = filtered.filter(l => l.actionType === action).length;
                    if (!count) return null;
                    return (
                        <span key={action} className={`ent-lozenge ${ACTION_LOZENGE[action] ?? 'bg-slate-500 text-white'}`}>
                            {action}: {count}
                        </span>
                    );
                })}
            </div>

            {/* ── Table View ── */}
            {viewMode === 'table' && (
                <div className="ent-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="ent-th w-6"></th>
                                    <th className="ent-th">{t('admin.auditLogs.timestamp')}</th>
                                    <th className="ent-th">{t('admin.auditLogs.user')}</th>
                                    <th className="ent-th">{t('admin.auditLogs.action')}</th>
                                    <th className="ent-th">{t('admin.auditLogs.entity')}</th>
                                    <th className="ent-th">{t('admin.auditLogs.details')}</th>
                                </tr>
                            </thead>
                            <>
                                {loading ? (
                                    <tbody className="bg-white dark:bg-slate-900">
                                        {[...Array(5)].map((_, i) => (
                                            <tr key={i}>
                                                {[...Array(6)].map((_, j) => (
                                                    <td key={j} className="px-4 py-2.5">
                                                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                ) : paged.length === 0 ? (
                                    <tbody className="bg-white dark:bg-slate-900">
                                        <tr>
                                            <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400 italic">
                                                {filtered.length === 0 && logs.length > 0 ? 'No logs match your filters.' : t('admin.auditLogs.noLogs')}
                                            </td>
                                        </tr>
                                    </tbody>
                                ) : (
                                    paged.map(log => (
                                        <tbody key={log.id} className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                                            <tr
                                                className="ent-tr cursor-pointer"
                                                onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                                            >
                                                <td className="px-2 py-2 text-slate-400">
                                                    {expandedRow === log.id
                                                        ? <ChevronDown className="h-3.5 w-3.5" />
                                                        : <ChevronRight className="h-3.5 w-3.5" />
                                                    }
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                                                        {safeFormat(log.timestamp || log.createdAt, 'dd/MM/yy HH:mm:ss')}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">
                                                    <div className="flex items-center gap-1.5">
                                                        <User className="h-3.5 w-3.5 text-primary dark:text-blue-400 flex-shrink-0" />
                                                        {log.user?.name || 'System'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    <span className={`ent-lozenge ${ACTION_LOZENGE[log.actionType] ?? 'bg-slate-500 text-white'}`}>
                                                        {log.actionType}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                                                    <span className="mr-1">{ENTITY_ICON[log.entityType] || '📄'}</span>
                                                    {log.entityType}{' '}
                                                    <span className="text-slate-400 dark:text-slate-500 font-mono text-xs">
                                                        #{log.entityId?.slice(0, 8)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 truncate max-w-xs" title={log.details}>
                                                    {log.details || '–'}
                                                </td>
                                            </tr>
                                            {expandedRow === log.id && (
                                                <tr className="bg-slate-50 dark:bg-slate-800/40">
                                                    <td colSpan={6} className="px-6 py-4">
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                                            <div>
                                                                <p className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Full Timestamp</p>
                                                                <p className="text-slate-900 dark:text-slate-200 font-mono">{safeFormat(log.timestamp || log.createdAt, 'yyyy-MM-dd HH:mm:ss')}</p>
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Entity ID</p>
                                                                <p className="text-slate-900 dark:text-slate-200 font-mono break-all">{log.entityId || '—'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">User ID</p>
                                                                <p className="text-slate-900 dark:text-slate-200 font-mono">{log.userId || '—'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Full Details</p>
                                                                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{log.details || '—'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    ))
                                )}
                            </>
                        </table>
                    </div>
                    <Pagination
                        meta={{ total: filtered.length, page, limit, totalPages }}
                        onPageChange={setPage}
                        onLimitChange={lim => { setLimit(lim); setPage(1); }}
                        limitOptions={[10, 20, 50, 100]}
                    />
                </div>
            )}

            {/* ── Timeline View ── */}
            {viewMode === 'timeline' && (
                <div className="ent-card p-4">
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex gap-3">
                                    <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse flex-shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-3/4" />
                                        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : paged.length === 0 ? (
                        <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-8">No logs match your filters.</p>
                    ) : (
                        <div className="relative">
                            {/* Vertical line */}
                            <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
                            <div className="space-y-0">
                                {paged.map((log) => (
                                    <div key={log.id} className="relative pl-10 pb-5">
                                        {/* Dot */}
                                        <div className={`absolute left-2 top-1 h-4 w-4 rounded-full flex items-center justify-center text-[9px] border-2 border-white dark:border-slate-900 ${
                                            log.actionType === 'DELETE' ? 'bg-red-500'
                                            : log.actionType === 'CREATE' ? 'bg-emerald-500'
                                            : log.actionType === 'UPDATE' ? 'bg-blue-500'
                                            : 'bg-slate-400'
                                        }`} />

                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`ent-lozenge text-[10px] ${ACTION_LOZENGE[log.actionType] ?? 'bg-slate-500 text-white'}`}>
                                                        {log.actionType}
                                                    </span>
                                                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                                        {ENTITY_ICON[log.entityType] || '📄'} {log.entityType}
                                                    </span>
                                                    {log.user?.name && (
                                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                                            by <strong>{log.user.name}</strong>
                                                        </span>
                                                    )}
                                                </div>
                                                {log.details && (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate max-w-lg">{log.details}</p>
                                                )}
                                            </div>
                                            <span className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap font-mono">
                                                {safeFormat(log.timestamp || log.createdAt, 'HH:mm:ss')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <Pagination
                        meta={{ total: filtered.length, page, limit, totalPages }}
                        onPageChange={setPage}
                        onLimitChange={lim => { setLimit(lim); setPage(1); }}
                        limitOptions={[10, 20, 50, 100]}
                    />
                </div>
            )}
        </div>
    );
};

export default AuditLogsPage;
