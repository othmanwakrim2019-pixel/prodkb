import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Download, CheckSquare, Square, X, Users, CheckCircle, XCircle } from 'lucide-react';
import { IncidentFilters } from '../components/IncidentFilters';
import type { Incident } from '../../../types';
import { useTranslation } from 'react-i18next';
import { Pagination } from '../../../components/ui/Pagination';
import { SLATimer } from '../../../components/SLATimer';
import { exportToCSV } from '../../../utils/exportCSV';
import { CanAccess } from '../../../components/CanAccess';
import { APP_PATHS } from '../../../app/route-meta';
import { incidentService } from '../api/incident.service';
import { useToast } from '../../../components/ui/Toast';
import { useConfirm } from '../../../components/ui/ConfirmDialog';

const SEV_COLOURS: Record<string, string> = {
    Critical: 'bg-red-700 text-white',
    High: 'bg-orange-600 text-white dark:bg-orange-900/40 dark:text-orange-400',
    Medium: 'bg-yellow-500 text-white dark:bg-yellow-900/40 dark:text-yellow-400',
    Low: 'bg-emerald-600 text-white dark:bg-emerald-900/40 dark:text-emerald-400',
};
const STATUS_COLOURS: Record<string, string> = {
    Open: 'bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-400',
    'In Progress': 'bg-yellow-200 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-400',
    Acknowledged: 'bg-blue-200 text-blue-900 dark:bg-blue-900/40 dark:text-blue-400',
    Resolved: 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-400',
    Closed: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
};

export const IncidentsPage = () => {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
    const [searchParams, setSearchParams] = useSearchParams();
    const { t } = useTranslation();
    const toast = useToast();
    const { confirm } = useConfirm();

    // ── Bulk selection state ──────────────────────────────────────────────
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkLoading, setBulkLoading] = useState(false);

    const allIds = incidents.map(i => i.id);
    const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
    const someSelected = selected.size > 0;

    const toggleOne = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        setSelected(allSelected ? new Set() : new Set(allIds));
    };

    const clearSelection = () => setSelected(new Set());

    // ── Fetch ─────────────────────────────────────────────────────────────
    const fetchIncidents = useCallback(async () => {
        setLoading(true);
        setSelected(new Set()); // clear selection on page change
        try {
            const page = Number(searchParams.get('page') || '1');
            const limit = Number(searchParams.get('limit') || '20');
            const result = await incidentService.getAll({
                page, limit,
                search: searchParams.get('search') || undefined,
                status: searchParams.get('status') || undefined,
                severity: searchParams.get('severity') || undefined,
                systemId: searchParams.get('systemId') || undefined,
                teamId: searchParams.get('teamId') || undefined,
                startDate: searchParams.get('startDate') || undefined,
                endDate: searchParams.get('endDate') || undefined,
            });
            setIncidents(result.data);
            setMeta({ total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages });
        } catch (error) {
            console.error('Failed to fetch incidents', error);
            setIncidents([]);
        } finally { setLoading(false); }
    }, [searchParams]);

    useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

    const handlePageChange = (newPage: number) => {
        const p = new URLSearchParams(searchParams); p.set('page', String(newPage)); setSearchParams(p);
    };
    const handleLimitChange = (newLimit: number) => {
        const p = new URLSearchParams(searchParams); p.set('limit', String(newLimit)); p.set('page', '1'); setSearchParams(p);
    };

    // ── Single delete ─────────────────────────────────────────────────────
    const handleDelete = async (id: string, title: string) => {
        if (!await confirm(`Delete incident "${title}"?`, 'This action cannot be undone.', 'danger')) return;
        try {
            await incidentService.delete(id);
            setIncidents(incidents.filter(inc => inc.id !== id));
            setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
        } catch { toast.error('Failed to delete incident'); }
    };

    // ── Bulk actions ──────────────────────────────────────────────────────
    const bulkUpdateStatus = async (status: string) => {
        const ids = [...selected];
        if (!await confirm(`Set ${ids.length} incident(s) to "${status}"?`, 'This will update all selected incidents.', 'danger')) return;
        setBulkLoading(true);
        let ok = 0;
        for (const id of ids) {
            try { await incidentService.updateStatus(id, status); ok++; } catch { /* skip */ }
        }
        toast.success(`Updated ${ok} of ${ids.length} incidents to "${status}"`);
        clearSelection();
        await fetchIncidents();
        setBulkLoading(false);
    };

    const bulkDelete = async () => {
        const ids = [...selected];
        if (!await confirm(`Delete ${ids.length} incident(s)?`, 'This action cannot be undone.', 'danger')) return;
        setBulkLoading(true);
        let ok = 0;
        for (const id of ids) {
            try { await incidentService.delete(id); ok++; } catch { /* skip */ }
        }
        toast.success(`Deleted ${ok} of ${ids.length} incidents`);
        clearSelection();
        await fetchIncidents();
        setBulkLoading(false);
    };

    return (
        <div className="space-y-4">
            {/* ── Header ── */}
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                    {t('incidents.title')}
                </h1>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => exportToCSV(Array.isArray(incidents) ? incidents : [], 'incidents', [
                            { key: 'title', label: 'Title' },
                            { key: 'severity', label: 'Severity' },
                            { key: 'status', label: 'Status' },
                            { key: 'environment', label: 'Environment' },
                            { key: 'createdAt', label: 'Created At' },
                        ])}
                        className="ent-btn-secondary"
                    >
                        <Download className="h-4 w-4" /> {t('common.exportCSV')}
                    </button>
                    <CanAccess permission="INCIDENT_CREATE">
                        <Link to={APP_PATHS.incidentNew} className="ent-btn-primary">
                            <Plus className="h-4 w-4" /> {t('common.newIncident')}
                        </Link>
                    </CanAccess>
                </div>
            </div>

            {/* Filters */}
            <IncidentFilters />

            {/* ── Bulk Action Bar ── */}
            {someSelected && (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/10 dark:bg-primary/20 border border-primary/30 rounded text-sm font-medium">
                    <span className="text-primary dark:text-blue-400 font-semibold">
                        {selected.size} selected
                    </span>
                    <div className="h-4 w-px bg-slate-300 dark:bg-slate-600" />
                    <button
                        onClick={() => bulkUpdateStatus('Resolved')}
                        disabled={bulkLoading}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60"
                    >
                        <CheckCircle className="h-3.5 w-3.5" /> Resolve
                    </button>
                    <button
                        onClick={() => bulkUpdateStatus('Closed')}
                        disabled={bulkLoading}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-600 text-white text-xs font-semibold hover:bg-slate-700 transition-colors disabled:opacity-60"
                    >
                        <XCircle className="h-3.5 w-3.5" /> Close
                    </button>
                    <button
                        onClick={() => bulkUpdateStatus('In Progress')}
                        disabled={bulkLoading}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-yellow-600 text-white text-xs font-semibold hover:bg-yellow-700 transition-colors disabled:opacity-60"
                    >
                        <Users className="h-3.5 w-3.5" /> In Progress
                    </button>
                    <CanAccess permission="INCIDENT_DELETE">
                        <button
                            onClick={bulkDelete}
                            disabled={bulkLoading}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
                        >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                    </CanAccess>
                    <button onClick={clearSelection} className="ml-auto p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* ── Table ── */}
            <div className="ent-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                {/* Select-all checkbox */}
                                <th className="w-10 px-3 py-2">
                                    <button onClick={toggleAll} className="text-slate-400 hover:text-primary transition-colors" title={allSelected ? 'Deselect all' : 'Select all'}>
                                        {allSelected
                                            ? <CheckSquare className="h-4 w-4 text-primary" />
                                            : <Square className="h-4 w-4" />}
                                    </button>
                                </th>
                                <th className="ent-th">Title</th>
                                <th className="ent-th">System / Job</th>
                                <th className="ent-th">Team</th>
                                <th className="ent-th">Created At</th>
                                <th className="ent-th">Severity</th>
                                <th className="ent-th">Status</th>
                                <th className="ent-th">SLA</th>
                                <th className="ent-th text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                            {incidents.map((incident) => {
                                const isChecked = selected.has(incident.id);
                                return (
                                    <tr
                                        key={incident.id}
                                        className={`ent-tr ${isChecked ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                                    >
                                        <td className="w-10 px-3 py-2">
                                            <button onClick={() => toggleOne(incident.id)} className="text-slate-400 hover:text-primary transition-colors">
                                                {isChecked
                                                    ? <CheckSquare className="h-4 w-4 text-primary" />
                                                    : <Square className="h-4 w-4" />}
                                            </button>
                                        </td>
                                        <td className="ent-td max-w-xs">
                                            <Link
                                                to={`/incidents/${incident.id}`}
                                                className="text-sm font-medium text-primary hover:text-primary-hover dark:text-blue-400 dark:hover:text-blue-300 block truncate"
                                                title={incident.title}
                                            >
                                                {incident.title}
                                            </Link>
                                        </td>
                                        <td className="ent-td whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900 dark:text-slate-200">{incident.system?.name || '-'}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">{incident.job?.name || '-'}</div>
                                        </td>
                                        <td className="ent-td whitespace-nowrap text-slate-700 dark:text-slate-300">
                                            {incident.assignedTeam?.name || '-'}
                                        </td>
                                        <td className="ent-td whitespace-nowrap text-slate-500 dark:text-slate-400">
                                            {new Date(incident.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="ent-td whitespace-nowrap">
                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${SEV_COLOURS[incident.severity] ?? 'bg-slate-200 text-slate-700'}`}>
                                                {incident.severity}
                                            </span>
                                        </td>
                                        <td className="ent-td whitespace-nowrap">
                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${STATUS_COLOURS[incident.status] ?? 'bg-slate-200 text-slate-700'}`}>
                                                {incident.status}
                                            </span>
                                        </td>
                                        <td className="ent-td whitespace-nowrap">
                                            <SLATimer
                                                createdAt={incident.createdAt}
                                                acknowledgedAt={(incident as unknown as Record<string, unknown>).acknowledgedAt as string | null}
                                                resolvedAt={incident.resolvedAt}
                                                status={incident.status}
                                                sla={(incident as unknown as Record<string, unknown>).sla as { acknowledgeTimeMinutes: number; resolveTimeMinutes: number } | null}
                                                slaBreached={(incident as unknown as Record<string, unknown>).slaBreached as boolean}
                                                variant="compact"
                                            />
                                        </td>
                                        <td className="ent-td text-right whitespace-nowrap">
                                            <CanAccess permission="INCIDENT_DELETE">
                                                <button
                                                    onClick={() => handleDelete(incident.id, incident.title)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded"
                                                    title="Delete incident"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </CanAccess>
                                        </td>
                                    </tr>
                                );
                            })}
                            {incidents.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={9} className="px-6 py-10 text-center text-slate-400 dark:text-slate-500 text-sm italic">
                                        No incidents found.
                                    </td>
                                </tr>
                            )}
                            {loading && (
                                <tr>
                                    <td colSpan={9} className="px-6 py-8 text-center">
                                        <div className="inline-flex items-center gap-2 text-sm text-slate-400">
                                            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            Loading incidents...
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination
                    meta={meta}
                    onPageChange={handlePageChange}
                    onLimitChange={handleLimitChange}
                    limitOptions={[10, 20, 50, 100]}
                />
            </div>
        </div>
    );
};

export default IncidentsPage;
