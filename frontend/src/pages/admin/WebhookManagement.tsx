import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Plus, Pencil, Trash2, Globe, Eye, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface Webhook {
    id: string;
    name: string;
    url: string;
    secret: string;
    events: string;
    isActive: boolean;
    createdAt: string;
    _count?: { deliveries: number };
}

interface Delivery {
    id: string;
    event: string;
    statusCode: number | null;
    success: boolean;
    attemptCount: number;
    error: string | null;
    createdAt: string;
}

const EVENTS = [
    'incident.created',
    'incident.updated',
    'incident.resolved',
    'incident.escalated',
    'incident.sla_breached',
];

const emptyForm = {
    name: '', url: '', secret: '', events: '' as string, isActive: true
};

export const WebhookManagement = () => {
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Webhook | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loadingDeliveries, setLoadingDeliveries] = useState(false);

    useEffect(() => { fetchWebhooks(); }, []);

    const fetchWebhooks = async () => {
        try {
            const res = await api.get('/api/v1/webhooks');
            setWebhooks(Array.isArray(res.data) ? res.data : res.data?.data || []);
        } catch (e) { console.error('Failed to load webhooks', e); }
        finally { setLoading(false); }
    };

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setSelectedEvents(new Set());
        setShowForm(true);
    };

    const openEdit = (w: Webhook) => {
        setEditing(w);
        setForm({ name: w.name, url: w.url, secret: '', events: w.events, isActive: w.isActive });
        setSelectedEvents(new Set(w.events.split(',').map(e => e.trim())));
        setShowForm(true);
    };

    const toggleEvent = (ev: string) => {
        const next = new Set(selectedEvents);
        if (next.has(ev)) next.delete(ev);
        else next.add(ev);
        setSelectedEvents(next);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedEvents.size === 0) { alert('Select at least one event'); return; }
        const payload = {
            name: form.name,
            url: form.url,
            events: Array.from(selectedEvents).join(','),
            isActive: form.isActive,
            ...(form.secret ? { secret: form.secret } : {}),
        };
        try {
            if (editing) {
                await api.put(`/api/v1/webhooks/${editing.id}`, payload);
            } else {
                if (!form.secret || form.secret.length < 16) {
                    alert('Secret must be at least 16 characters');
                    return;
                }
                await api.post('/api/v1/webhooks', { ...payload, secret: form.secret });
            }
            setShowForm(false);
            fetchWebhooks();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            alert(axiosErr.response?.data?.message || 'Failed to save webhook');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this webhook and all its delivery history?')) return;
        try {
            await api.delete(`/api/v1/webhooks/${id}`);
            if (expandedId === id) setExpandedId(null);
            fetchWebhooks();
        } catch (err) { alert('Failed to delete'); }
    };

    const handleToggle = async (w: Webhook) => {
        try {
            await api.put(`/api/v1/webhooks/${w.id}`, { isActive: !w.isActive });
            fetchWebhooks();
        } catch (err) { alert('Failed to toggle'); }
    };

    const toggleDeliveries = async (id: string) => {
        if (expandedId === id) { setExpandedId(null); return; }
        setExpandedId(id);
        setLoadingDeliveries(true);
        try {
            const res = await api.get(`/api/v1/webhooks/${id}/deliveries`);
            setDeliveries(Array.isArray(res.data) ? res.data : res.data?.data || []);
        } catch (e) { console.error('Failed to load deliveries', e); }
        finally { setLoadingDeliveries(false); }
    };

    if (loading) return <div className="animate-pulse p-6"><div className="h-8 w-64 bg-slate-200 rounded mb-4" /><div className="h-48 bg-slate-100 rounded" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2"><Globe className="w-5 h-5 text-purple-500" /> Webhooks</h2>
                    <p className="text-sm text-slate-500">Send incident events to external systems via HTTP webhooks (HMAC-SHA256 signed)</p>
                </div>
                <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm">
                    <Plus className="w-4 h-4" /> Add Webhook
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSave} className="bg-white border rounded-lg p-6 space-y-4 shadow-sm">
                    <h3 className="font-semibold text-lg">{editing ? 'Edit Webhook' : 'New Webhook'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Name *</label>
                            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required minLength={2}
                                className="w-full p-2 border rounded-md" placeholder="e.g. PagerDuty integration" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">URL *</label>
                            <input type="url" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} required
                                className="w-full p-2 border rounded-md" placeholder="https://example.com/webhook" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">
                                Secret {editing ? <span className="text-slate-400">(leave blank to keep current)</span> : '*'}
                            </label>
                            <input value={form.secret} onChange={e => setForm({ ...form, secret: e.target.value })}
                                className="w-full p-2 border rounded-md font-mono text-sm" placeholder="min 16 characters — used for HMAC-SHA256 signing"
                                {...(!editing ? { required: true, minLength: 16 } : {})} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Events *</label>
                        <div className="flex flex-wrap gap-2">
                            {EVENTS.map(ev => (
                                <button key={ev} type="button" onClick={() => toggleEvent(ev)}
                                    className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${selectedEvents.has(ev)
                                        ? 'bg-purple-50 border-purple-300 text-purple-700'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}>
                                    {ev}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} id="wh-active" />
                        <label htmlFor="wh-active" className="text-sm">Active</label>
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600">Cancel</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                            {editing ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            )}

            {webhooks.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    <Globe className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No webhooks configured yet.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {webhooks.map(w => (
                        <div key={w.id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
                            <div className="p-4 flex items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold truncate">{w.name}</h4>
                                        <button onClick={() => handleToggle(w)} className={`text-xs px-2 py-0.5 rounded-full font-medium ${w.isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-500 border'}`}>
                                            {w.isActive ? 'Active' : 'Inactive'}
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 font-mono truncate">{w.url}</p>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {w.events.split(',').map(ev => (
                                            <span key={ev} className="text-xs bg-purple-50 border border-purple-200 px-2 py-0.5 rounded text-purple-700">
                                                {ev.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button onClick={() => toggleDeliveries(w.id)}
                                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50"
                                        title="View delivery history">
                                        <Eye className="w-4 h-4" />
                                        {w._count?.deliveries || 0}
                                        {expandedId === w.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    </button>
                                    <button onClick={() => openEdit(w)} className="p-1.5 text-slate-500 hover:text-blue-600 rounded hover:bg-blue-50"><Pencil className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(w.id)} className="p-1.5 text-slate-500 hover:text-red-600 rounded hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>

                            {expandedId === w.id && (
                                <div className="border-t bg-slate-50 p-4">
                                    <h5 className="text-sm font-semibold mb-2">Recent Deliveries</h5>
                                    {loadingDeliveries ? (
                                        <div className="animate-pulse h-16 bg-slate-100 rounded" />
                                    ) : deliveries.length === 0 ? (
                                        <p className="text-sm text-slate-400">No deliveries yet</p>
                                    ) : (
                                        <div className="space-y-1 max-h-64 overflow-y-auto">
                                            {deliveries.map(d => (
                                                <div key={d.id} className="flex items-center gap-3 text-xs py-1.5 px-2 rounded bg-white border">
                                                    {d.success
                                                        ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                                        : <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                                                    <span className="font-mono text-slate-600">{d.event}</span>
                                                    <span className="text-slate-400">→ {d.statusCode || 'N/A'}</span>
                                                    <span className="text-slate-400">({d.attemptCount} attempt{d.attemptCount > 1 ? 's' : ''})</span>
                                                    {d.error && <span className="text-red-500 truncate max-w-[200px]" title={d.error}>{d.error}</span>}
                                                    <span className="ml-auto text-slate-400">{new Date(d.createdAt).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
