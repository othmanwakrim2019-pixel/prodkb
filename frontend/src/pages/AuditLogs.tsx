import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { Filter, Clock, User, Shield } from 'lucide-react';
import { format } from 'date-fns';

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

    // Filters
    const [actionType, setActionType] = useState('');
    const [entityType, setEntityType] = useState('');

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params: { action?: string; entityType?: string } = {};
            if (actionType) params.action = actionType;
            if (entityType) params.entityType = entityType;

            const res = await api.get('/api/audit-logs', { params });
            setLogs(res.data);
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
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
                <p className="text-muted-foreground">Track system activity and security events</p>
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
                        <option value="">All Actions</option>
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
                        <option value="">All Entities</option>
                        <option value="USER">User</option>
                        <option value="INCIDENT">Incident</option>
                        <option value="ROLE">Role</option>
                        <option value="SYSTEM">System</option>
                    </select>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-md border shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="px-4 py-3 font-medium text-slate-700">Timestamp</th>
                            <th className="px-4 py-3 font-medium text-slate-700">User</th>
                            <th className="px-4 py-3 font-medium text-slate-700">Action</th>
                            <th className="px-4 py-3 font-medium text-slate-700">Entity</th>
                            <th className="px-4 py-3 font-medium text-slate-700">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {logs.map(log => (
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
                                    No audit logs found matching criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                {loading && <div className="p-4 text-center text-slate-500">Loading logs...</div>}
            </div>
        </div>
    );
};

export default AuditLogs;
