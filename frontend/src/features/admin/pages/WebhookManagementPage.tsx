import { useState, useEffect } from 'react';
import { Plus, Globe, Pencil, Trash2, Eye, CheckCircle2, XCircle, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { webhookService, type Webhook, type WebhookDelivery } from '../api/admin.service';
import { useToast } from '../../../components/ui/Toast';
import { useConfirm } from '../../../components/ui/ConfirmDialog';

const EVENTS = [
    'incident.created',
    'incident.updated',
    'incident.resolved',
    'incident.escalated',
    'incident.sla_breached',
];

const emptyForm = { name: '', url: '', secret: '', events: '' as string, isActive: true };

export const WebhookManagementPage = () => {
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const toast = useToast();
    const { confirm: confirmAction } = useConfirm();
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Webhook | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
    const [loadingDeliveries, setLoadingDeliveries] = useState(false);

    useEffect(() => { fetchWebhooks(); }, []);

    const fetchWebhooks = async () => {
        try {
            const data = await webhookService.getAll();
            setWebhooks(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const openCreate = () => { setEditing(null); setForm(emptyForm); setSelectedEvents(new Set()); setShowForm(true); };
    const openEdit = (w: Webhook) => {
        setEditing(w);
        setForm({ name: w.name, url: w.url, secret: '', events: w.events, isActive: w.isActive });
        setSelectedEvents(new Set(w.events.split(',').map(e => e.trim())));
        setShowForm(true);
    };

    const toggleEvent = (ev: string) => {
        const next = new Set(selectedEvents);
        if (next.has(ev)) next.delete(ev); else next.add(ev);
        setSelectedEvents(next);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedEvents.size === 0) { toast.error('Select at least one event'); return; }
        const payload = {
            name: form.name, url: form.url,
            events: Array.from(selectedEvents).join(','),
            isActive: form.isActive,
            ...(form.secret ? { secret: form.secret } : {}),
        };
        try {
            if (editing) {
                await webhookService.update(editing.id, payload);
            } else {
                if (!form.secret || form.secret.length < 16) { toast.error('Secret must be at least 16 characters'); return; }
                await webhookService.create({ ...payload, secret: form.secret });
            }
            setShowForm(false);
            await fetchWebhooks();
            toast.success(editing ? 'Webhook updated' : 'Webhook created');
        } catch (err: unknown) {
            const ax = err as { response?: { data?: { message?: string } } };
            toast.error(ax.response?.data?.message || 'Failed to save webhook');
        }
    };

    const handleDelete = async (id: string) => {
        if (!await confirmAction('Delete this webhook?', 'All delivery history will be permanently removed.', 'danger')) return;
        try { await webhookService.delete(id); if (expandedId === id) setExpandedId(null); await fetchWebhooks(); }
        catch { toast.error('Failed to delete webhook'); }
    };

    const handleToggle = async (w: Webhook) => {
        try { await webhookService.update(w.id, { isActive: !w.isActive }); await fetchWebhooks(); }
        catch { toast.error('Failed to toggle webhook'); }
    };

    const toggleDeliveries = async (id: string) => {
        if (expandedId === id) { setExpandedId(null); return; }
        setExpandedId(id); setLoadingDeliveries(true);
        try { const data = await webhookService.getDeliveries(id); setDeliveries(Array.isArray(data) ? data : []); }
        catch (e) { console.error(e); }
        finally { setLoadingDeliveries(false); }
    };

    const filtered = webhooks.filter(w =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.url.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="p-4 text-sm text-slate-500 dark:text-slate-400">Loading...</div>;

    return (
        <div className="space-y-4">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white self-start flex items-center gap-2">
                    <Globe className="h-4 w-4 text-slate-500" /> Webhooks
                </h2>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search webhooks..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="ent-input pl-8 md:w-56"
                        />
                    </div>
                    <button onClick={openCreate} className="ent-btn-primary whitespace-nowrap">
                        <Plus className="h-4 w-4" /> Add Webhook
                    </button>
                </div>
            </div>

            {/* ── Create / Edit Form ── */}
            {showForm && (
                <form onSubmit={handleSave} className="ent-card p-4 space-y-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {editing ? 'Edit Webhook' : 'New Webhook'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
                            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required minLength={2}
                                className="ent-input" placeholder="e.g. PagerDuty integration" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">URL *</label>
                            <input type="url" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} required
                                className="ent-input" placeholder="https://example.com/webhook" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Secret {editing ? <span className="text-slate-400">(leave blank to keep current)</span> : '*'}
                            </label>
                            <input value={form.secret} onChange={e => setForm({ ...form, secret: e.target.value })}
                                className="ent-input font-mono" placeholder="min 16 characters — HMAC-SHA256 signing key"
                                {...(!editing ? { required: true, minLength: 16 } : {})} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Events *</label>
                        <div className="flex flex-wrap gap-1.5">
                            {EVENTS.map(ev => (
                                <button key={ev} type="button" onClick={() => toggleEvent(ev)}
                                    className={`text-xs px-2.5 py-1 rounded border transition-none ${selectedEvents.has(ev)
                                        ? 'bg-primary text-white border-primary'
                                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-primary'
                                    }`}>
                                    {ev}
                                </button>
                            ))}
                        </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-primary" />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Active</span>
                    </label>

                    <div className="flex gap-2 justify-end pt-2">
                        <button type="button" onClick={() => setShowForm(false)} className="ent-btn-secondary">Cancel</button>
                        <button type="submit" className="ent-btn-primary">{editing ? 'Update' : 'Create'}</button>
                    </div>
                </form>
            )}

            {/* ── Webhooks table ── */}
            <div className="ent-card overflow-hidden">
                {filtered.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400 text-center italic">
                        {webhooks.length === 0 ? 'No webhooks configured.' : 'No results match your search.'}
                    </p>
                ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {filtered.map(w => (
                            <div key={w.id}>
                                {/* Row */}
                                <div className="flex items-center px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-none">
                                    <button
                                        onClick={() => toggleDeliveries(w.id)}
                                        className="mr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    >
                                        {expandedId === w.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">{w.name}</span>
                                            <span className={`ent-lozenge ${w.isActive ? 'bg-emerald-600 text-white' : 'bg-slate-400 text-white'}`}>
                                                {w.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate block">{w.url}</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {w.events.split(',').map(ev => (
                                                <span key={ev} className="ent-lozenge bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                                    {ev.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 ml-3 shrink-0">
                                        <button onClick={() => toggleDeliveries(w.id)}
                                            className="p-1.5 rounded text-slate-400 hover:text-primary transition-colors flex items-center gap-1 text-xs"
                                            title="View delivery history">
                                            <Eye className="h-3.5 w-3.5" />
                                            <span>{w._count?.deliveries || 0}</span>
                                        </button>
                                        <button onClick={() => handleToggle(w)} className="p-1.5 rounded text-slate-400 hover:text-amber-600 transition-colors" title="Toggle active">
                                            <span className="text-xs font-medium">{w.isActive ? 'Disable' : 'Enable'}</span>
                                        </button>
                                        <button onClick={() => openEdit(w)} className="p-1.5 rounded text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors" title="Edit">
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        <button onClick={() => handleDelete(w.id)} className="p-1.5 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Delete">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Deliveries expanded */}
                                {expandedId === w.id && (
                                    <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 px-4 py-3">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                                            Recent Deliveries
                                        </span>
                                        {loadingDeliveries ? (
                                            <div className="h-8 bg-slate-100 dark:bg-slate-700 animate-pulse rounded" />
                                        ) : deliveries.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic">No deliveries yet</p>
                                        ) : (
                                            <div className="ent-card overflow-hidden">
                                                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                                                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                                                        <tr>
                                                            <th className="ent-th">Status</th>
                                                            <th className="ent-th">Event</th>
                                                            <th className="ent-th">HTTP</th>
                                                            <th className="ent-th">Attempts</th>
                                                            <th className="ent-th">Date</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                                        {deliveries.map(d => (
                                                            <tr key={d.id} className="ent-tr">
                                                                <td className="ent-td">
                                                                    {d.success
                                                                        ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                                        : <XCircle className="h-4 w-4 text-red-500" />}
                                                                </td>
                                                                <td className="ent-td font-mono">{d.event}</td>
                                                                <td className="ent-td">{d.statusCode || 'N/A'}</td>
                                                                <td className="ent-td">{d.attemptCount}</td>
                                                                <td className="ent-td text-slate-500 dark:text-slate-400">{new Date(d.createdAt).toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WebhookManagementPage;
