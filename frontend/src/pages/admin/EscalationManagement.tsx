import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Plus, Pencil, Trash2, AlertTriangle, Zap } from 'lucide-react';
import { Pagination } from '../../components/ui/Pagination';

interface EscalationRule {
    id: string;
    name: string;
    systemId: string | null;
    severity: string | null;
    level: number;
    teamId: string;
    delayMinutes: number;
    isActive: boolean;
    system?: { id: string; name: string } | null;
    team?: { id: string; name: string } | null;
}

interface SelectOption { id: string; name: string; }

const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];

const emptyForm = {
    name: '', systemId: '', severity: '', level: 1, teamId: '', delayMinutes: 15, isActive: true
};

export const EscalationManagement = () => {
    const [rules, setRules] = useState<EscalationRule[]>([]);
    const [systems, setSystems] = useState<SelectOption[]>([]);
    const [teams, setTeams] = useState<SelectOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<EscalationRule | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            const [rulesRes, sysRes, teamsRes] = await Promise.all([
                api.get('/api/v1/escalation-rules'),
                api.get('/api/v1/systems'),
                api.get('/api/v1/teams'),
            ]);
            setRules(Array.isArray(rulesRes.data) ? rulesRes.data : rulesRes.data?.data || []);
            setSystems(Array.isArray(sysRes.data) ? sysRes.data : sysRes.data?.data || []);
            setTeams(Array.isArray(teamsRes.data) ? teamsRes.data : teamsRes.data?.data || []);
        } catch (e) { console.error('Failed to load escalation data', e); }
        finally { setLoading(false); }
    };

    const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
    const openEdit = (r: EscalationRule) => {
        setEditing(r);
        setForm({
            name: r.name, systemId: r.systemId || '', severity: r.severity || '',
            level: r.level, teamId: r.teamId, delayMinutes: r.delayMinutes, isActive: r.isActive,
        });
        setShowForm(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...form,
            systemId: form.systemId || null,
            severity: form.severity || null,
        };
        try {
            if (editing) {
                await api.put(`/api/v1/escalation-rules/${editing.id}`, payload);
            } else {
                await api.post('/api/v1/escalation-rules', payload);
            }
            setShowForm(false);
            fetchAll();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            alert(axiosErr.response?.data?.message || 'Failed to save rule');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this escalation rule?')) return;
        try {
            await api.delete(`/api/v1/escalation-rules/${id}`);
            fetchAll();
        } catch (err) { alert('Failed to delete'); }
    };

    const handleToggle = async (r: EscalationRule) => {
        try {
            await api.put(`/api/v1/escalation-rules/${r.id}`, { isActive: !r.isActive });
            fetchAll();
        } catch (err) { alert('Failed to toggle'); }
    };

    if (loading) return <div className="animate-pulse p-6"><div className="h-8 w-64 bg-slate-200 rounded mb-4" /><div className="h-48 bg-slate-100 rounded" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-orange-500" /> Escalation Rules</h2>
                    <p className="text-sm text-slate-500">Auto-escalate incidents when SLA deadlines are breached</p>
                </div>
                <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm">
                    <Plus className="w-4 h-4" /> Add Rule
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSave} className="bg-white border rounded-lg p-6 space-y-4 shadow-sm">
                    <h3 className="font-semibold text-lg">{editing ? 'Edit Rule' : 'New Escalation Rule'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Rule Name *</label>
                            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required minLength={2}
                                className="w-full p-2 border rounded-md" placeholder="e.g. Critical DB escalation" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Level (1–10) *</label>
                            <input type="number" value={form.level} onChange={e => setForm({ ...form, level: parseInt(e.target.value) || 1 })}
                                min={1} max={10} className="w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">System <span className="text-slate-400">(optional)</span></label>
                            <select value={form.systemId} onChange={e => setForm({ ...form, systemId: e.target.value })} className="w-full p-2 border rounded-md">
                                <option value="">All Systems</option>
                                {systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Severity <span className="text-slate-400">(optional)</span></label>
                            <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })} className="w-full p-2 border rounded-md">
                                <option value="">All Severities</option>
                                {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Assign to Team *</label>
                            <select value={form.teamId} onChange={e => setForm({ ...form, teamId: e.target.value })} required className="w-full p-2 border rounded-md">
                                <option value="">Select team...</option>
                                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Delay (minutes) *</label>
                            <input type="number" value={form.delayMinutes} onChange={e => setForm({ ...form, delayMinutes: parseInt(e.target.value) || 1 })}
                                min={1} className="w-full p-2 border rounded-md" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} id="esc-active" />
                        <label htmlFor="esc-active" className="text-sm">Active</label>
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600">Cancel</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                            {editing ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            )}

            {rules.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No escalation rules configured yet.</p>
                </div>
            ) : (
                <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="text-left px-4 py-3 font-semibold">Name</th>
                                <th className="text-left px-4 py-3 font-semibold">Level</th>
                                <th className="text-left px-4 py-3 font-semibold">System</th>
                                <th className="text-left px-4 py-3 font-semibold">Severity</th>
                                <th className="text-left px-4 py-3 font-semibold">Escalate to</th>
                                <th className="text-left px-4 py-3 font-semibold">Delay</th>
                                <th className="text-left px-4 py-3 font-semibold">Status</th>
                                <th className="text-right px-4 py-3 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rules.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE).map(r => (
                                <tr key={r.id} className="border-b last:border-b-0 hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium">{r.name}</td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center gap-1 text-xs bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full text-orange-700">
                                            <Zap className="w-3 h-3" /> L{r.level}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{r.system?.name || <span className="text-slate-400 italic">All</span>}</td>
                                    <td className="px-4 py-3 text-slate-600">{r.severity || <span className="text-slate-400 italic">All</span>}</td>
                                    <td className="px-4 py-3">{r.team?.name || '—'}</td>
                                    <td className="px-4 py-3 text-slate-600">{r.delayMinutes}m</td>
                                    <td className="px-4 py-3">
                                        <button onClick={() => handleToggle(r)} className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-500 border'}`}>
                                            {r.isActive ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex gap-1 justify-end">
                                            <button onClick={() => openEdit(r)} className="p-1.5 text-slate-500 hover:text-blue-600 rounded hover:bg-blue-50"><Pencil className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(r.id)} className="p-1.5 text-slate-500 hover:text-red-600 rounded hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {rules.length > ITEMS_PER_PAGE && (
                <Pagination
                    meta={{
                        total: rules.length,
                        page,
                        limit: ITEMS_PER_PAGE,
                        totalPages: Math.ceil(rules.length / ITEMS_PER_PAGE),
                    }}
                    onPageChange={setPage}
                />
            )}
        </div>
    );
};
