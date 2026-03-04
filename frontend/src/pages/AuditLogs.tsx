import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { Filter, Clock, User, Shield, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Pagination } from '../components/ui/Pagination';
import { exportToCSV } from '../utils/exportCSV';

interface AuditLog {
    id: string;
    actionType: string;
    entityType: string;
    entityId: string;
    details: string;
    timestamp: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
}

const AuditLogs = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();

    // Filters
    const [actionType, setActionType] = useState('');
    const [entityType, setEntityType] = useState('');
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params: { action?: string; entityType?: string } = {};
            if (actionType) params.action = actionType;
            if (entityType) params.entityType = entityType;

            const res = await api.get('/api/v1/audit-logs', { params });
            setLogs(Array.isArray(res.data) ? res.data : res.data?.data || []);
        } catch (error) {
            console.error('Failed to fetch audit logs', error);
        } finally {
            setLoading(false);
        }
    }, [actionType, entityType]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight dark:text-white">{t('admin.auditLogs.title')}</h1>
                    <p className="text-muted-foreground dark:text-slate-400">{t('admin.auditLogs.subtitle')}</p>
                </div>
                <button
                    onClick={() => exportToCSV(Array.isArray(logs) ? logs : [], 'audit_logs', [
                        { key: 'timestamp', label: 'Timestamp' },
                        { key: 'actionType', label: 'Action' },
                        { key: 'entityType', label: 'Entity' },
                        { key: 'entityId', label: 'Entity ID' },
                        { key: 'details', label: 'Details' },
                    ])}
                    className="inline-flex items-center px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                    <Download className="-ml-0.5 mr-1.5 h-4 w-4" />
                    {t('common.exportCSV')}
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border shadow-sm flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-500" />
                    <select
                        className="text-sm border rounded px-2 py-1"
                        value={actionType}
                        onChange={e => setActionType(e.target.value)}
                    >
                        <option value="">{t('admin.auditLogs.allActions')}</option>
                        <option value="LOGIN">LOGIN</option>
                        <option value="CREATE">CREATE</option>
                        <option value="UPDATE">UPDATE</option>
                        <option value="DELETE">DELETE</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-slate-500" />
                    <select
                        className="text-sm border rounded px-2 py-1"
                        value={entityType}
                        onChange={e => setEntityType(e.target.value)}
                    >
                        <option value="">{t('admin.auditLogs.allEntities')}</option>
                        <option value="USER">{t('common.user')}</option>
                        <option value="INCIDENT">{t('incidents.title')}</option>
                        <option value="ROLE">{t('common.role')}</option>
                        <option value="SYSTEM">{t('common.system')}</option>
                    </select>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-md border shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="px-4 py-3 font-medium text-slate-700">{t('admin.auditLogs.timestamp')}</th>
                            <th className="px-4 py-3 font-medium text-slate-700">{t('admin.auditLogs.user')}</th>
                            <th className="px-4 py-3 font-medium text-slate-700">{t('admin.auditLogs.action')}</th>
                            <th className="px-4 py-3 font-medium text-slate-700">{t('admin.auditLogs.entity')}</th>
                            <th className="px-4 py-3 font-medium text-slate-700">{t('admin.auditLogs.details')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {logs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE).map(log => (
                            <tr key={log.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3 h-3" />
                                        {format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <User className="w-3 h-3 text-slate-400" />
                                        <span className="font-medium text-slate-700">{log.user?.name || 'Unknown'}</span>
                                    </div>
                                    <div className="text-xs text-slate-400 ml-5">{log.user?.email}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${log.actionType === 'DELETE' ? 'bg-red-100 text-red-800' :
                                        log.actionType === 'CREATE' ? 'bg-green-100 text-green-800' :
                                            log.actionType === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                                                'bg-slate-100 text-slate-800'
                                        }`}>
                                        {log.actionType}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                    {log.entityType} <span className="text-slate-400">#{log.entityId.slice(0, 8)}</span>
                                </td>
                                <td className="px-4 py-3 text-slate-600 max-w-md truncate" title={log.details}>
                                    {log.details || '-'}
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 && !loading && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                    {t('admin.auditLogs.noLogs')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                {loading && <div className="p-4 text-center text-slate-500">{t('admin.auditLogs.loadingLogs')}</div>}

                {/* Pagination */}
                {logs.length > ITEMS_PER_PAGE && (
                    <Pagination
                        meta={{
                            total: logs.length,
                            page,
                            limit: ITEMS_PER_PAGE,
                            totalPages: Math.ceil(logs.length / ITEMS_PER_PAGE),
                        }}
                        onPageChange={setPage}
                    />
                )}
            </div>
        </div>
    );
};

export default AuditLogs;
