import { useState, useEffect } from 'react';
import { Plus, Wrench, Trash2, Edit, Clock, Search } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { maintenanceService, systemService, type MaintenanceWindow } from '../api/admin.service';
import type { System } from '../../../types';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';

const LOZENGE: Record<string, string> = {
    scheduled: 'bg-blue-600 text-white',
    active:    'bg-amber-500 text-white',
    completed: 'bg-emerald-600 text-white',
    cancelled: 'bg-slate-400 text-white',
};

function formatDT(iso: string) {
    return new Date(iso).toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

export default function MaintenanceAdminPage() {
    const [windows, setWindows] = useState<MaintenanceWindow[]>([]);
    const [systems, setSystems] = useState<System[]>([]);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState<MaintenanceWindow | null>(null);
    const [form, setForm] = useState({ systemId: '', title: '', description: '', scheduledAt: '', endsAt: '' });
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const toast = useToast();

    const isAdmin = user?.role === 'ADMIN';

    const load = async () => {
        setLoadError(null);
        try {
            const [nextWindows, nextSystems] = await Promise.all([
                maintenanceService.getAll(),
                systemService.getAll(),
            ]);
            setWindows(Array.isArray(nextWindows) ? nextWindows : []);
            setSystems(Array.isArray(nextSystems) ? nextSystems : []);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } }; message?: string };
            setLoadError(e?.response?.data?.message || e?.message || 'Failed to load.');
        }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => { setEditItem(null); setForm({ systemId: '', title: '', description: '', scheduledAt: '', endsAt: '' }); setShowForm(true); };
    const openEdit = (mw: MaintenanceWindow) => {
        setEditItem(mw);
        setForm({
            systemId: mw.system.id,
            title: mw.title,
            description: mw.description || '',
            scheduledAt: new Date(mw.scheduledAt).toISOString().slice(0, 16),
            endsAt: new Date(mw.endsAt).toISOString().slice(0, 16),
        });
        setShowForm(true);
    };

    const save = async () => {
        if (!form.systemId) { setSaveError('Please select a system.'); return; }
        if (!form.title.trim()) { setSaveError('Title is required.'); return; }
        if (!form.scheduledAt) { setSaveError('Start date is required.'); return; }
        if (!form.endsAt) { setSaveError('End date is required.'); return; }
        const start = new Date(form.scheduledAt), end = new Date(form.endsAt);
        if (end <= start) { setSaveError('End date must be after start date.'); return; }

        setSaving(true); setSaveError(null);
        try {
            const payload = { systemId: form.systemId, title: form.title.trim(), description: form.description || undefined, scheduledAt: form.scheduledAt, endsAt: form.endsAt };
            if (editItem) { await maintenanceService.update(editItem.id, payload); }
            else { await maintenanceService.create(payload); }
            setShowForm(false);
            await load();
            toast.success(editItem ? 'Maintenance window updated' : 'Maintenance window created');
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string; error?: { message?: string } } }; message?: string };
            setSaveError(e?.response?.data?.message || e?.message || 'Failed to save.');
        } finally { setSaving(false); }
    };

    const remove = async (id: string) => {
        if (!await confirm('Delete this maintenance window?', 'This action cannot be undone.', 'danger')) return;
        try { await maintenanceService.delete(id); await load(); toast.success('Maintenance window deleted'); }
        catch { toast.error('Failed to delete'); }
    };

    const filtered = windows.filter(w =>
        w.title.toLowerCase().includes(search.toLowerCase()) ||
        w.system.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-4">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white self-start flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-slate-500" /> Maintenance Windows
                </h2>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="ent-input pl-8 md:w-56"
                        />
                    </div>
                    {isAdmin && (
                        <button onClick={openCreate} className="ent-btn-primary whitespace-nowrap">
                            <Plus className="h-4 w-4" /> New Window
                        </button>
                    )}
                </div>
            </div>

            {/* ── Inline form ── */}
            {showForm && (
                <div className="ent-card p-4 space-y-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {editItem ? 'Edit Maintenance Window' : 'New Maintenance Window'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">System *</label>
                            <select value={form.systemId} onChange={e => setForm(f => ({ ...f, systemId: e.target.value }))} className="ent-input">
                                <option value="">Select a system...</option>
                                {systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Title *</label>
                            <input placeholder="e.g. Database upgrade" value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="ent-input" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                            <textarea placeholder="Optional description" value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                rows={2} className="ent-input resize-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Start *</label>
                            <input type="datetime-local" value={form.scheduledAt}
                                onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} className="ent-input" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">End *</label>
                            <input type="datetime-local" value={form.endsAt}
                                onChange={e => setForm(f => ({ ...f, endsAt: e.target.value }))} className="ent-input" />
                        </div>
                    </div>
                    {saveError && (
                        <p className="text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
                            {saveError}
                        </p>
                    )}
                    <div className="flex gap-2 justify-end">
                        <button onClick={() => { setShowForm(false); setSaveError(null); }} className="ent-btn-secondary">Cancel</button>
                        <button onClick={save} disabled={saving} className="ent-btn-primary">
                            {saving ? 'Saving...' : editItem ? 'Update' : 'Create'}
                        </button>
                    </div>
                </div>
            )}

            {/* ── Load Error ── */}
            {loadError && (
                <div className="flex items-center gap-2 px-4 py-3 rounded border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-400">
                    <span>{loadError}</span>
                    <button onClick={load} className="ml-auto text-xs underline">Retry</button>
                </div>
            )}

            {/* ── Table ── */}
            <div className="ent-card overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <th className="ent-th">Title</th>
                            <th className="ent-th">System</th>
                            <th className="ent-th">Status</th>
                            <th className="ent-th">Schedule</th>
                            {isAdmin && <th className="ent-th text-right">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={isAdmin ? 5 : 4} className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400 italic">
                                    {windows.length === 0 ? 'No maintenance windows scheduled.' : 'No results match your search.'}
                                </td>
                            </tr>
                        ) : (
                            filtered.map(mw => (
                                <tr key={mw.id} className="ent-tr">
                                    <td className="ent-td">
                                        <div className="font-medium text-slate-900 dark:text-slate-200">{mw.title}</div>
                                        {mw.description && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xs">{mw.description}</div>}
                                    </td>
                                    <td className="ent-td font-medium text-primary dark:text-blue-400">{mw.system.name}</td>
                                    <td className="ent-td">
                                        <span className={`ent-lozenge ${LOZENGE[mw.status] ?? 'bg-slate-400 text-white'}`}>{mw.status}</span>
                                    </td>
                                    <td className="ent-td">
                                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                            <Clock className="h-3 w-3" />
                                            <span>{formatDT(mw.scheduledAt)}</span>
                                            <span>→</span>
                                            <span>{formatDT(mw.endsAt)}</span>
                                        </div>
                                    </td>
                                    {isAdmin && (
                                        <td className="ent-td text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openEdit(mw)} className="p-1.5 rounded text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors" title="Edit">
                                                    <Edit className="h-3.5 w-3.5" />
                                                </button>
                                                <button onClick={() => remove(mw.id)} className="p-1.5 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Delete">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
