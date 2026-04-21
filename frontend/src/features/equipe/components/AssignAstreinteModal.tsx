import { useState } from 'react';
import { X } from 'lucide-react';
import { astreinteService } from '../api/astreinte.service';
import type { Astreinte, CreateAstreinteDto, UpdateAstreinteDto } from '../api/astreinte.service';
import { useToast } from '../../../components/ui/Toast';

interface Member { id: string; name: string; }
interface Team   { id: string; name: string; }

interface AssignAstreinteModalProps {
    weekNumber: number;
    year:       number;
    startDate:  Date;
    endDate:    Date;
    teams:      Team[];
    members:    Member[];
    existing?:  Astreinte;
    onClose:    () => void;
    onSaved:    () => void;
}

const labelClass = 'block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1';

export function AssignAstreinteModal({
    weekNumber, year, startDate, endDate,
    teams, members, existing, onClose, onSaved,
}: AssignAstreinteModalProps) {
    const toast = useToast();
    const [teamId, setTeamId] = useState(existing?.teamId ?? (teams[0]?.id ?? ''));
    const [userId, setUserId] = useState(existing?.userId ?? '');
    const [phone,  setPhone]  = useState(existing?.phone  ?? '');
    const [notes,  setNotes]  = useState(existing?.notes  ?? '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!userId) { toast.error('Sélectionnez un membre.'); return; }
        setSaving(true);
        try {
            if (existing) {
                const dto: UpdateAstreinteDto = { userId, phone: phone || null, notes: notes || null };
                await astreinteService.update(existing.id, dto);
            } else {
                const dto: CreateAstreinteDto = {
                    teamId, userId, weekNumber, year,
                    startDate: startDate.toISOString(),
                    endDate:   endDate.toISOString(),
                    phone:     phone || undefined,
                    notes:     notes || undefined,
                };
                await astreinteService.create(dto);
            }
            toast.success(existing ? 'Astreinte mise à jour.' : 'Astreinte assignée.');
            onSaved();
            onClose();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(msg ?? 'Erreur lors de l\'enregistrement.');
        } finally {
            setSaving(false);
        }
    };

    const startLabel = startDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const endLabel   = endDate.toLocaleDateString('fr-FR',   { weekday: 'long', day: 'numeric', month: 'long' });

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
                        {existing ? 'Modifier l\'astreinte' : 'Assigner l\'astreinte'}
                    </h3>
                    <button
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors"
                        onClick={onClose}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-col gap-4">
                    {/* Week info */}
                    <div>
                        <label className={labelClass}>Semaine</label>
                        <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded border border-slate-200 dark:border-slate-700">
                            Semaine {weekNumber} — {startLabel} au {endLabel}
                        </p>
                    </div>

                    {/* Team (only for create + multiple teams) */}
                    {!existing && teams.length > 1 && (
                        <div>
                            <label className={labelClass}>Équipe</label>
                            <select className="ent-input w-full" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Assignee */}
                    <div>
                        <label className={labelClass}>Responsable d'astreinte *</label>
                        <select className="ent-input w-full" value={userId} onChange={(e) => setUserId(e.target.value)}>
                            <option value="">— Choisir un membre —</option>
                            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className={labelClass}>Téléphone direct (optionnel)</label>
                        <input
                            className="ent-input w-full"
                            placeholder="+212 6XX XXX XXX"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className={labelClass}>Notes / Instructions (optionnel)</label>
                        <textarea
                            className="ent-input w-full resize-none"
                            rows={3}
                            placeholder="Instructions spéciales pour cette semaine..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button className="ent-btn-secondary" onClick={onClose}>Annuler</button>
                    <button className="ent-btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Enregistrement...' : existing ? 'Mettre à jour' : 'Assigner'}
                    </button>
                </div>
            </div>
        </div>
    );
}
