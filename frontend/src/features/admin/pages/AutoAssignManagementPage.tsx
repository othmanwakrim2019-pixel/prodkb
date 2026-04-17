import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, GitBranch, Search } from 'lucide-react';
import { Pagination } from '../../../components/ui/Pagination';
import { autoAssignRuleService, systemService, teamService, type AdminSelectOption, type AutoAssignRule } from '../api/admin.service';
import { useToast } from '../../../components/ui/Toast';
import { useConfirm } from '../../../components/ui/ConfirmDialog';

const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];
const emptyForm = { name: '', systemId: '', severity: '', teamId: '', priority: 0, isActive: true };

export const AutoAssignManagementPage = () => {
    const [rules, setRules] = useState<AutoAssignRule[]>([]);
    const [systems, setSystems] = useState<AdminSelectOption[]>([]);
    const [teams, setTeams] = useState<AdminSelectOption[]>([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();
    const { confirm } = useConfirm();
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<AutoAssignRule | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            const [nextRules, nextSystems, nextTeams] = await Promise.all([
                autoAssignRuleService.getAll(),
                systemService.getAll(),
                teamService.getAll(),
            ]);
            setRules(Array.isArray(nextRules) ? nextRules : []);
            setSystems(Array.isArray(nextSystems) ? nextSystems : []);
            setTeams(Array.isArray(nextTeams) ? nextTeams : []);
        } catch (e) { console.error('Failed to load auto-assign data', e); }
        finally { setLoading(false); }
    };

    const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
    const openEdit = (r: AutoAssignRule) => {
        setEditing(r);
        setForm({ name: r.name, systemId: r.systemId || '', severity: r.severity || '', teamId: r.teamId, priority: r.priority, isActive: r.isActive });
        setShowForm(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...form, systemId: form.systemId || null, severity: form.severity || null };
        try {
            if (editing) { await autoAssignRuleService.update(editing.id, payload); }
            else { await autoAssignRuleService.create(payload); }
            setShowForm(false);
            await fetchAll();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            toast.error(axiosErr.response?.data?.message || 'Failed to save rule');
        }
    };

    const handleDelete = async (id: string) => {
        if (!await confirm('Delete this auto-assignment rule?', 'This action cannot be undone.', 'danger')) return;
        try { await autoAssignRuleService.delete(id); await fetchAll(); }
        catch { toast.error('Failed to delete rule'); }
    };

    const handleToggle = async (r: AutoAssignRule) => {
        try { await autoAssignRuleService.update(r.id, { isActive: !r.isActive }); await fetchAll(); }
        catch { toast.error('Failed to toggle rule'); }
    };

    if (loading) return <div className="p-4 text-sm text-slate-500 dark:text-slate-400">Loading...</div>;

    const filtered = rules.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
    const totalPages = Math.ceil(filtered.length / limit);

    return (
        <div className="space-y-4">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white self-start flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-slate-500" /> Auto-Assignment Rules
                </h2>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input type="text" placeholder="Search rules..." value={search} onChange={e => setSearch(e.target.value)} className="ent-input pl-8 md:w-56" />
                    </div>
                    <button onClick={openCreate} className="ent-btn-primary whitespace-nowrap">
                        <Plus className="h-4 w-4" /> Add Rule
                    </button>
                </div>
            </div>

            {showForm && (
                <form onSubmit={handleSave} className="ent-card p-4 space-y-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {editing ? 'Edit Rule' : 'New Auto-Assignment Rule'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Rule Name *</label>
                            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required minLength={2}
                                className="ent-input" placeholder="e.g. Critical DB → DBA Team" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                            <input type="number" value={form.priority} onChange={e => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
                                min={0} className="ent-input" />
                            <p className="text-xs text-slate-400 mt-1">Higher = evaluated first</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">System <span className="text-slate-400">(optional)</span></label>
                            <select value={form.systemId} onChange={e => setForm({ ...form, systemId: e.target.value })} className="ent-input">
                                <option value="">All Systems</option>
                                {systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Severity <span className="text-slate-400">(optional)</span></label>
                            <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })} className="ent-input">
                                <option value="">All Severities</option>
                                {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Assign to Team *</label>
                            <select value={form.teamId} onChange={e => setForm({ ...form, teamId: e.target.value })} required className="ent-input">
                                <option value="">Select team...</option>
                                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} id="aa-active" />
                        <label htmlFor="aa-active" className="text-xs text-slate-700 dark:text-slate-300">Active</label>
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                        <button type="button" onClick={() => setShowForm(false)} className="ent-btn-secondary">Cancel</button>
                        <button type="submit" className="ent-btn-primary">{editing ? 'Update' : 'Create'}</button>
                    </div>
                </form>
            )}

            <div className="ent-card overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <th className="ent-th">Name</th>
                            <th className="ent-th">System</th>
                            <th className="ent-th">Severity</th>
                            <th className="ent-th">Assign to</th>
                            <th className="ent-th">Priority</th>
                            <th className="ent-th">Status</th>
                            <th className="ent-th text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400 italic">
                                    {rules.length === 0 ? 'No auto-assignment rules configured yet.' : 'No results match your search.'}
                                </td>
                            </tr>
                        ) : (
                            filtered.slice((page - 1) * limit, page * limit).map(r => (
                                <tr key={r.id} className="ent-tr">
                                    <td className="ent-td font-medium text-slate-900 dark:text-slate-200 whitespace-nowrap">{r.name}</td>
                                    <td className="ent-td whitespace-nowrap">{r.system?.name || <span className="text-slate-400 italic">All</span>}</td>
                                    <td className="ent-td whitespace-nowrap">{r.severity || <span className="text-slate-400 italic">All</span>}</td>
                                    <td className="ent-td whitespace-nowrap">{r.team?.name || '—'}</td>
                                    <td className="ent-td whitespace-nowrap">
                                        <span className="ent-lozenge bg-indigo-600 text-white">P{r.priority}</span>
                                    </td>
                                    <td className="ent-td whitespace-nowrap">
                                        <button onClick={() => handleToggle(r)}
                                            className={`ent-lozenge ${r.isActive ? 'bg-emerald-600 text-white' : 'bg-slate-400 text-white'}`}>
                                            {r.isActive ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="ent-td text-right whitespace-nowrap">
                                        <div className="flex gap-1 justify-end">
                                            <button onClick={() => openEdit(r)} className="p-1.5 rounded text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <Pagination
                    meta={{ total: filtered.length, page, limit, totalPages }}
                    onPageChange={setPage}
                    onLimitChange={lim => { setLimit(lim); setPage(1); }}
                    limitOptions={[10, 20, 50]}
                />
            </div>
        </div>
    );
};

export default AutoAssignManagementPage;
