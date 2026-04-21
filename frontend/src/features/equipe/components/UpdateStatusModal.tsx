import { useState } from 'react';
import { X } from 'lucide-react';
import type { OperationalTask, TaskStatus } from '../api/equipe.service';
import { equipeService } from '../api/equipe.service';
import { TASK_STATUS_LABELS } from './equipe.constants';
import { useToast } from '../../../components/ui/Toast';

interface UpdateStatusModalProps {
    task:    OperationalTask;
    onClose: () => void;
    onSaved: (updated: OperationalTask) => void;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string; tw: string }[] = [
    { value: 'IN_PROGRESS', label: '▶ Démarrer',         tw: 'bg-blue-600 hover:bg-blue-700 text-white' },
    { value: 'DONE',        label: '✅ Marquer terminé',  tw: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
    { value: 'BLOCKED',     label: '⚠️ Signaler blocage', tw: 'bg-red-600 hover:bg-red-700 text-white' },
    { value: 'TODO',        label: '↩ Remettre à faire', tw: 'bg-slate-500 hover:bg-slate-600 text-white' },
];

export function UpdateStatusModal({ task, onClose, onSaved }: UpdateStatusModalProps) {
    const toast = useToast();
    const [status, setStatus] = useState<TaskStatus>(task.status);
    const [note,   setNote]   = useState(task.note ?? '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (status === 'BLOCKED' && !note.trim()) {
            toast.error('Veuillez décrire la raison du blocage.');
            return;
        }
        setSaving(true);
        try {
            const updated = await equipeService.updateTaskStatus(task.id, { status, note: note || undefined });
            toast.success('Statut mis à jour.');
            onSaved(updated);
            onClose();
        } catch {
            toast.error('Erreur lors de la mise à jour.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="ent-card w-full max-w-md p-6 flex flex-col gap-5"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                        Mettre à jour le statut
                    </h3>
                    <button
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors"
                        onClick={onClose}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Task title */}
                <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Tâche</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{task.title}</p>
                </div>

                {/* Status buttons */}
                <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Nouveau statut</p>
                    <div className="grid grid-cols-2 gap-2">
                        {STATUS_OPTIONS.map((s) => (
                            <button
                                key={s.value}
                                onClick={() => setStatus(s.value)}
                                className={`px-3 py-2 rounded text-sm font-medium transition-colors ring-2 ring-transparent ${
                                    status === s.value
                                        ? `${s.tw} ring-offset-1 ring-offset-white dark:ring-offset-slate-900 ring-current`
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        {TASK_STATUS_LABELS[task.status]} → <strong className="text-slate-800 dark:text-slate-200">{TASK_STATUS_LABELS[status]}</strong>
                    </p>
                </div>

                {/* Note */}
                <div>
                    <label htmlFor="status-note" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Note {status === 'BLOCKED' ? '(raison du blocage — obligatoire)' : '(optionnelle)'}
                    </label>
                    <textarea
                        id="status-note"
                        rows={3}
                        className="ent-input w-full resize-none"
                        placeholder={status === 'BLOCKED' ? 'Décrivez le blocage...' : 'Ajoutez une note...'}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    />
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-1">
                    <button className="ent-btn-secondary" onClick={onClose}>Annuler</button>
                    <button
                        className="ent-btn-primary"
                        onClick={handleSave}
                        disabled={saving || (status === 'BLOCKED' && !note.trim())}
                    >
                        {saving ? 'Enregistrement...' : 'Confirmer'}
                    </button>
                </div>
            </div>
        </div>
    );
}
