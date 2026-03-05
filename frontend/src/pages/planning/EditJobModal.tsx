import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import axios from '../../utils/axios';
import type { PlanningJob } from '../../types/planning';

interface EditJobModalProps {
    job: PlanningJob | null;
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    existingJobs: PlanningJob[];
}

export const EditJobModal = ({ job, isOpen, onClose, onSaved, existingJobs }: EditJobModalProps) => {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Form fields
    const [customTaskName, setCustomTaskName] = useState('');
    const [supportContact, setSupportContact] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [selectedDeps, setSelectedDeps] = useState<string[]>([]);
    const [notes, setNotes] = useState('');

    // Populate form when job changes
    useEffect(() => {
        if (!job) return;
        const dt = new Date(job.scheduledTime);
        setCustomTaskName(job.customTaskName || '');
        setSupportContact(job.supportContact || '');
        setScheduledDate(dt.toISOString().slice(0, 10));
        setScheduledTime(dt.toTimeString().slice(0, 5));
        setSelectedDeps(job.dependencies);
        setNotes(job.notes || '');
        setError('');
    }, [job]);

    if (!isOpen || !job) return null;

    const isManual = job.taskType === 'MANUAL_ACTION';

    const toggleDep = (id: string) => {
        setSelectedDeps(prev =>
            prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        if (!scheduledDate || !scheduledTime) {
            setError("La date et l'heure sont requises.");
            return;
        }
        setSaving(true);
        setError('');
        try {
            const scheduledTimeISO = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString();
            const payload: Record<string, unknown> = {
                scheduledTime: scheduledTimeISO,
                dependencies: selectedDeps,
                supportContact: supportContact.trim() || null,
            };
            if (isManual && customTaskName.trim()) {
                payload.customTaskName = customTaskName.trim();
            }
            if (notes.trim()) {
                payload.notes = notes.trim();
            }

            await axios.put(`/api/v1/planning/jobs/${job.id}`, payload);
            onSaved();
            onClose();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
                || 'Impossible de sauvegarder les modifications.';
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    const otherJobs = existingJobs.filter(j => j.id !== job.id);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <h2 className="text-base font-semibold text-slate-800">Modifier la tâche</h2>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {error && (
                        <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Task name (MANUAL only) */}
                    {isManual && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nom de la tâche</label>
                            <input
                                type="text"
                                value={customTaskName}
                                onChange={e => setCustomTaskName(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="ex. Fermeture des agences"
                            />
                        </div>
                    )}

                    {/* BATCH task: show name as read-only */}
                    {!isManual && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tâche (batch)</label>
                            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
                                {job.job?.name || '—'} <span className="text-slate-400">/ {job.system?.name}</span>
                            </div>
                        </div>
                    )}

                    {/* Date + Time */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                            <input
                                type="date"
                                value={scheduledDate}
                                onChange={e => setScheduledDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Heure</label>
                            <input
                                type="time"
                                value={scheduledTime}
                                onChange={e => setScheduledTime(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Support contact */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Responsable / Contact support</label>
                        <input
                            type="text"
                            value={supportContact}
                            onChange={e => setSupportContact(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="ex. exploitation_centrale"
                        />
                    </div>

                    {/* Dependencies */}
                    {otherJobs.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Dépendances</label>
                            <div className="max-h-36 overflow-y-auto space-y-1 border border-slate-200 rounded-lg p-2">
                                {otherJobs.map(j => (
                                    <label key={j.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 px-2 py-1 rounded">
                                        <input
                                            type="checkbox"
                                            checked={selectedDeps.includes(j.id)}
                                            onChange={() => toggleDep(j.id)}
                                            className="accent-indigo-600"
                                        />
                                        <span className="text-slate-700">{j.customTaskName || j.job?.name || 'Tâche'}</span>
                                        <span className="text-xs text-slate-400 ml-auto">
                                            {new Date(j.scheduledTime).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Internal notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Note interne (optionnel)</label>
                        <input
                            type="text"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Commentaire ou observation"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/50">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        Annuler
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors"
                    >
                        {saving ? (
                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sauvegarde...</>
                        ) : (
                            <><Save className="w-4 h-4" /> Sauvegarder</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

