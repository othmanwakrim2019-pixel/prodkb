import { useState, useEffect } from 'react';
import { Plus, Wrench, Trash2, Edit, Clock } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { maintenanceService, systemService, type MaintenanceWindow } from '../api/admin.service';
import type { System } from '../../../types';
import { useConfirm } from '../../../components/ui/ConfirmDialog';

const statusBadge: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    active: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    cancelled: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
};

function formatDT(iso: string) {
    return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function MaintenanceAdminPage() {
    const [windows, setWindows] = useState<MaintenanceWindow[]>([]);
    const [systems, setSystems] = useState<System[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState<MaintenanceWindow | null>(null);
    const [form, setForm] = useState({ systemId: '', title: '', description: '', scheduledAt: '', endsAt: '' });
    const { user } = useAuth();
    const { confirm } = useConfirm();

    // The page is already protected by PermissionRoute(MAINTENANCE_MANAGE) in App.tsx.
    // Admin role gets additional UI controls (e.g. delete without confirmation).
    const isAdmin = user?.role === 'ADMIN';

    const [loadError, setLoadError] = useState<string | null>(null);

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
            console.error('Failed to load maintenance data:', err);
            const e = err as { response?: { data?: { message?: string } }; message?: string };
            setLoadError(e?.response?.data?.message || e?.message || 'Erreur lors du chargement.');
        }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => {
        setEditItem(null);
        setForm({ systemId: '', title: '', description: '', scheduledAt: '', endsAt: '' });
        setShowForm(true);
    };

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

    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const save = async () => {
        // Validation
        if (!form.systemId) {
            setSaveError('Veuillez sélectionner un système.');
            return;
        }
        if (!form.title || form.title.trim() === '') {
            setSaveError('Le titre est obligatoire.');
            return;
        }
        if (!form.scheduledAt) {
            setSaveError('La date de début est obligatoire.');
            return;
        }
        if (!form.endsAt) {
            setSaveError('La date de fin est obligatoire.');
            return;
        }

        // Validate date logic
        const start = new Date(form.scheduledAt);
        const end = new Date(form.endsAt);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            setSaveError('Format de date invalide.');
            return;
        }
        if (end <= start) {
            setSaveError('La date de fin doit être après la date de début.');
            return;
        }

        setSaving(true);
        setSaveError(null);
        try {
            const payload = {
                systemId: form.systemId,
                title: form.title.trim(),
                description: form.description ? form.description.trim() : undefined,
                scheduledAt: form.scheduledAt,
                endsAt: form.endsAt,
            };

            if (editItem) {
                await maintenanceService.update(editItem.id, payload);
            } else {
                await maintenanceService.create(payload);
            }
            setShowForm(false);
            setSaveError(null);
            setForm({ systemId: '', title: '', description: '', scheduledAt: '', endsAt: '' });
            await load();
        } catch (err: unknown) {
            console.error('Save error:', err);
            const e = err as { response?: { data?: { message?: string; error?: { message?: string } } }; message?: string };
            const msg = e?.response?.data?.message ||
                e?.response?.data?.error?.message ||
                e?.message ||
                'Erreur lors de la sauvegarde.';
            setSaveError(msg);
        } finally {
            setSaving(false);
        }
    };

    const remove = async (id: string) => {
        if (!await confirm('Delete this maintenance window?', 'This action cannot be undone.', 'danger')) return;
        await maintenanceService.delete(id);
        await load();
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Wrench className="h-6 w-6 text-blue-500" /> Plages de Maintenance
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Planifiez des maintenances pour suspendre les SLAs et afficher un badge sur la page de statut.
                    </p>
                </div>
                {isAdmin && (
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus className="h-4 w-4" /> Nouvelle maintenance
                    </button>
                )}
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {editItem ? 'Modifier la maintenance' : 'Nouvelle maintenance'}
                        </h2>
                        <div className="space-y-3">
                            <select
                                value={form.systemId}
                                onChange={e => setForm(f => ({ ...f, systemId: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
                            >
                                <option value="">Sélectionner un système</option>
                                {systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <input
                                placeholder="Titre (ex: Mise à jour BDD)"
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400"
                            />
                            <textarea
                                placeholder="Description (optionnelle)"
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                rows={2}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 resize-none"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Début</label>
                                    <input
                                        type="datetime-local"
                                        value={form.scheduledAt}
                                        onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Fin</label>
                                    <input
                                        type="datetime-local"
                                        value={form.endsAt}
                                        onChange={e => setForm(f => ({ ...f, endsAt: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                        {saveError && (
                            <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{saveError}</p>
                        )}
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => { setShowForm(false); setSaveError(null); }} className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                Annuler
                            </button>
                            <button onClick={save} disabled={saving} className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors">
                                {saving ? 'Enregistrement...' : editItem ? 'Enregistrer' : 'Créer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Load Error */}
            {loadError && (
                <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                    <span>⚠️ {loadError}</span>
                    <button onClick={load} className="ml-auto text-xs underline hover:no-underline">Réessayer</button>
                </div>
            )}

            {/* List */}
            {windows.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                    <Wrench className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Aucune maintenance planifiée</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {windows.map(mw => (
                        <div key={mw.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-sm text-slate-900 dark:text-white">{mw.title}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusBadge[mw.status]}`}>
                                        {mw.status}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500 flex items-center gap-3">
                                    <span className="font-medium text-blue-600 dark:text-blue-400">{mw.system.name}</span>
                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDT(mw.scheduledAt)} → {formatDT(mw.endsAt)}</span>
                                    {mw.description && <span className="truncate max-w-xs">{mw.description}</span>}
                                </div>
                            </div>
                            {isAdmin && (
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button onClick={() => openEdit(mw)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                        <Edit className="h-4 w-4 text-slate-500" />
                                    </button>
                                    <button onClick={() => remove(mw.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
