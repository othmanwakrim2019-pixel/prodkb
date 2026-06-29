import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { SLA, Severity } from '../../../types';
import { useTranslation } from 'react-i18next';
import { slaService } from '../api/admin.service';
import { Pagination } from '../../../components/ui/Pagination';
import { useToast } from '../../../components/ui/Toast';
import { useConfirm } from '../../../components/ui/ConfirmDialog';

export const SLAManagementPage = () => {
    const { canManageSLAs } = useAuth();
    const { t } = useTranslation();
    const toast = useToast();
    const { confirm } = useConfirm();
    const [slas, setSlas] = useState<SLA[]>([]);
    const [showSlaForm, setShowSlaForm] = useState(false);
    const [newSla, setNewSla] = useState({ name: '', description: '', severity: 'Medium', acknowledgeTimeMinutes: 60, resolveTimeMinutes: 480 });
    const [editingSla, setEditingSla] = useState<SLA | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    useEffect(() => {
        fetchSlas();
    }, []);

    const fetchSlas = async () => {
        try {
            const data = await slaService.getAll();
            setSlas(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch SLAs', error);
        }
    };

    const handleCreateSla = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await slaService.create(newSla);
            setNewSla({ name: '', description: '', severity: 'Medium', acknowledgeTimeMinutes: 60, resolveTimeMinutes: 480 });
            setShowSlaForm(false);
            await fetchSlas();
            toast.success('SLA created successfully!');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            console.error('Failed to create SLA', err);
            toast.error(error.response?.data?.message || 'Failed to create SLA');
        }
    };

    const handleUpdateSla = async () => {
        if (!editingSla) return;
        try {
            await slaService.update(editingSla.id, {
                name: editingSla.name,
                description: editingSla.description,
                severity: editingSla.severity,
                acknowledgeTimeMinutes: Number(editingSla.acknowledgeTimeMinutes),
                resolveTimeMinutes: Number(editingSla.resolveTimeMinutes)
            });
            setEditingSla(null);
            await fetchSlas();
            toast.success('SLA updated successfully!');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            console.error('Failed to update SLA', err);
            toast.error(error.response?.data?.message || 'Failed to update SLA');
        }
    };

    const handleDeleteSla = async (slaId: string) => {
        if (!await confirm('Delete this SLA policy?', 'This action cannot be undone.', 'danger')) return;
        try {
            await slaService.delete(slaId);
            await fetchSlas();
            toast.success('SLA deleted successfully!');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            console.error('Failed to delete SLA', err);
            toast.error(error.response?.data?.message || 'Failed to delete SLA');
        }
    };

    const filtered = slas.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    const totalPages = Math.ceil(filtered.length / limit);

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white self-start">{t('admin.slas.title')}</h2>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input type="text" placeholder="Search SLAs..." value={search} onChange={e => setSearch(e.target.value)} className="ent-input pl-8 md:w-56" />
                    </div>
                    {canManageSLAs() && (
                        <button onClick={() => setShowSlaForm(!showSlaForm)} className="ent-btn-primary whitespace-nowrap">
                            <Plus className="h-4 w-4" />{t('admin.slas.addSla')}
                        </button>
                    )}
                </div>
            </div>

            {showSlaForm && (
                <form onSubmit={handleCreateSla} className="ent-card p-4 space-y-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('admin.slas.addSla')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Policy Name</label>
                            <input
                                type="text"
                                required
                                value={newSla.name}
                                onChange={(e) => setNewSla({ ...newSla, name: e.target.value })}
                                className="ent-input"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                            <textarea
                                value={newSla.description}
                                onChange={(e) => setNewSla({ ...newSla, description: e.target.value })}
                                className="ent-input"
                                rows={2}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Severity Level</label>
                            <select
                                value={newSla.severity}
                                onChange={(e) => setNewSla({ ...newSla, severity: e.target.value as Severity })}
                                className="ent-input"
                            >
                                <option value="Critical">Critical</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Ack Time (min)</label>
                                <input type="number" required min="1" value={newSla.acknowledgeTimeMinutes}
                                    onChange={(e) => setNewSla({ ...newSla, acknowledgeTimeMinutes: parseInt(e.target.value) || 0 })}
                                    className="ent-input" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Resolve Time (min)</label>
                                <input type="number" required min="1" value={newSla.resolveTimeMinutes}
                                    onChange={(e) => setNewSla({ ...newSla, resolveTimeMinutes: parseInt(e.target.value) || 0 })}
                                    className="ent-input" />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setShowSlaForm(false)}
                            className="ent-btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="ent-btn-primary"
                        >
                            Create Policy
                        </button>
                    </div>
                </form>
            )}

            <div className="ent-card overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Severity</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Name</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Ack Time</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Resolve Time</th>
                            {canManageSLAs() && <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                        {filtered.slice((page - 1) * limit, page * limit).map((sla) => (
                            <tr key={sla.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-none">
                                <td className="px-4 py-2 whitespace-nowrap">
                                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${sla.severity === 'Critical' ? 'bg-red-600 text-white dark:bg-red-900/40 dark:text-red-400' :
                                        sla.severity === 'High' ? 'bg-orange-600 text-white dark:bg-orange-900/40 dark:text-orange-400' :
                                            sla.severity === 'Medium' ? 'bg-yellow-600 text-white dark:bg-yellow-900/40 dark:text-yellow-400' :
                                                'bg-blue-600 text-white dark:bg-blue-900/40 dark:text-blue-400'
                                        }`}>
                                        {sla.severity}
                                    </span>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">
                                    {sla.name}
                                    <div className="text-xs text-slate-500 dark:text-slate-400 font-normal">{sla.description}</div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{sla.acknowledgeTimeMinutes} min</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{sla.resolveTimeMinutes} min</td>
                                {canManageSLAs() && (
                                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => setEditingSla(sla)}
                                            className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 mr-3"
                                            title="Edit SLA"
                                        >
                                            <Pencil className="h-4 w-4 inline" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSla(sla.id)}
                                            className="text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                                            title="Delete SLA"
                                        >
                                            <Trash2 className="h-4 w-4 inline" />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                <Pagination
                    meta={{ total: filtered.length, page, limit, totalPages }}
                    onPageChange={setPage}
                    onLimitChange={lim => { setLimit(lim); setPage(1); }}
                    limitOptions={[10, 20, 50]}
                />
            </div>

            {editingSla && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-lg max-w-xl w-full mx-4">
                        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Edit SLA Policy</h3>
                        </div>
                        <div className="p-5 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Policy Name</label>
                                    <input type="text" value={editingSla.name}
                                        onChange={(e) => setEditingSla({ ...editingSla, name: e.target.value })}
                                        className="ent-input" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                    <textarea value={editingSla.description}
                                        onChange={(e) => setEditingSla({ ...editingSla, description: e.target.value })}
                                        className="ent-input" rows={2} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Severity Level</label>
                                    <select value={editingSla.severity}
                                        onChange={(e) => setEditingSla({ ...editingSla, severity: e.target.value as Severity })}
                                        className="ent-input">
                                        <option value="Critical">Critical</option>
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Ack Time (min)</label>
                                        <input type="number" min="1" value={editingSla.acknowledgeTimeMinutes}
                                            onChange={(e) => setEditingSla({ ...editingSla, acknowledgeTimeMinutes: parseInt(e.target.value) || 0 })}
                                            className="ent-input" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Resolve Time (min)</label>
                                        <input type="number" min="1" value={editingSla.resolveTimeMinutes}
                                            onChange={(e) => setEditingSla({ ...editingSla, resolveTimeMinutes: parseInt(e.target.value) || 0 })}
                                            className="ent-input" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
                            <button onClick={() => setEditingSla(null)} className="ent-btn-secondary">Cancel</button>
                            <button onClick={handleUpdateSla} className="ent-btn-primary">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SLAManagementPage;
