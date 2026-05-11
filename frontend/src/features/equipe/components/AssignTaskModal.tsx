import { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';
import type { CreateTaskDto, TaskType, TaskPriority } from '../api/equipe.service';
import { equipeService } from '../api/equipe.service';
import { TASK_TYPE_LABELS, TASK_PRIORITY_LABELS } from './equipe.constants';
import { useToast } from '../../../components/ui/Toast';

interface System { id: string; name: string; }
interface User   { id: string; name: string; }

interface AssignTaskModalProps {
    planId:         string;
    members:        User[];
    systems:        System[];
    preAssignedTo?: string;
    onClose:        () => void;
    onSaved:        () => void;
}

const TASK_TYPES:      TaskType[]     = ['MEP', 'SUPERVISION', 'TABLEAU_BORD', 'REPRISE_INCIDENT', 'CONTROLE_CHAINE', 'RAPPORT', 'CUSTOM'];
const TASK_PRIORITIES: TaskPriority[] = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'];

const labelClass = 'block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1';

/**
 * Convert a datetime-local input value ("2026-04-21T10:30") to a full ISO string
 * that Zod's z.string().datetime() accepts ("2026-04-21T10:30:00.000Z").
 */
function toIso(value: string): string | undefined {
    if (!value) return undefined;
    // Already has timezone info
    if (value.includes('Z') || value.includes('+')) return value;
    // datetime-local format: "YYYY-MM-DDTHH:mm" — append seconds + Z
    return value.length === 16 ? `${value}:00.000Z` : `${value}.000Z`;
}

export function AssignTaskModal({ planId, members, systems, preAssignedTo, onClose, onSaved }: AssignTaskModalProps) {
    const toast = useToast();
    const [form, setForm] = useState<CreateTaskDto>({
        title:        '',
        description:  '',
        taskType:     'CUSTOM',
        priority:     'NORMAL',
        assignedToId: preAssignedTo ?? '',
        startTime:    '',
        endTime:      '',
        systemId:     '',
        chainLabel:   '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (preAssignedTo) setForm((f) => ({ ...f, assignedToId: preAssignedTo }));
    }, [preAssignedTo]);

    const set = (key: keyof CreateTaskDto, value: string) => setForm((f) => ({ ...f, [key]: value }));

    const handleSave = async () => {
        if (!form.title.trim()) { toast.error('Le titre est obligatoire.'); return; }
        if (!form.assignedToId) { toast.error('Sélectionnez un membre.'); return; }
        setSaving(true);
        try {
            const dto: CreateTaskDto = {
                ...form,
                startTime:   toIso(form.startTime  as string),
                endTime:     toIso(form.endTime    as string),
                systemId:    form.systemId    || undefined,
                chainLabel:  form.chainLabel  || undefined,
                description: form.description || undefined,
            };
            await equipeService.createTask(planId, dto);
            toast.success('Tâche assignée avec succès.');
            onSaved();
            onClose();
        } catch {
            toast.error('Erreur lors de l\'assignation de la tâche.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="ent-card w-full max-w-2xl flex flex-col gap-0 max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                            Assigner une tâche
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Remplissez les informations de la tâche à assigner
                        </p>
                    </div>
                    <button
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                        onClick={onClose}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto px-6 py-5 flex flex-col gap-4">
                    {/* Title */}
                    <div>
                        <label className={labelClass}>Titre *</label>
                        <input
                            className="ent-input w-full"
                            placeholder="Ex: Relance batch CBS-GP, MEP v2.4.1..."
                            value={form.title}
                            onChange={(e) => set('title', e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Assignee */}
                        <div>
                            <label className={labelClass}>Assigné à *</label>
                            <select className="ent-input w-full" value={form.assignedToId} onChange={(e) => set('assignedToId', e.target.value)}>
                                <option value="">— Choisir —</option>
                                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>

                        {/* Task type */}
                        <div>
                            <label className={labelClass}>Type de tâche</label>
                            <select className="ent-input w-full" value={form.taskType} onChange={(e) => set('taskType', e.target.value as TaskType)}>
                                {TASK_TYPES.map((t) => <option key={t} value={t}>{TASK_TYPE_LABELS[t]}</option>)}
                            </select>
                        </div>

                        {/* Priority */}
                        <div>
                            <label className={labelClass}>Priorité</label>
                            <select className="ent-input w-full" value={form.priority} onChange={(e) => set('priority', e.target.value as TaskPriority)}>
                                {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{TASK_PRIORITY_LABELS[p]}</option>)}
                            </select>
                        </div>

                        {/* System */}
                        <div>
                            <label className={labelClass}>Système / Serveur</label>
                            <select className="ent-input w-full" value={form.systemId} onChange={(e) => set('systemId', e.target.value)}>
                                <option value="">— Aucun —</option>
                                {systems.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Chain label */}
                    <div>
                        <label className={labelClass}>Chaîne (texte libre)</label>
                        <input
                            className="ent-input w-full"
                            placeholder="Ex: Chaîne compta, Chaîne virements..."
                            value={form.chainLabel}
                            onChange={(e) => set('chainLabel', e.target.value)}
                        />
                    </div>

                    {/* Times */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>
                                <Clock size={11} className="inline mr-1" />
                                Heure de début
                            </label>
                            <input
                                type="datetime-local"
                                className="ent-input w-full"
                                value={form.startTime as string}
                                onChange={(e) => set('startTime', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>
                                <Clock size={11} className="inline mr-1" />
                                Heure de fin
                            </label>
                            <input
                                type="datetime-local"
                                className="ent-input w-full"
                                value={form.endTime as string}
                                onChange={(e) => set('endTime', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className={labelClass}>Description / Instructions</label>
                        <textarea
                            className="ent-input w-full resize-none"
                            rows={3}
                            placeholder="Instructions détaillées pour l'opérateur..."
                            value={form.description}
                            onChange={(e) => set('description', e.target.value)}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                    <button className="ent-btn-secondary" onClick={onClose}>Annuler</button>
                    <button className="ent-btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Assignation...' : 'Assigner la tâche'}
                    </button>
                </div>
            </div>
        </div>
    );
}
