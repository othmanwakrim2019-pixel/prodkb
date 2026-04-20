import { useState } from 'react';
import { X } from 'lucide-react';
import type { Astreinte } from '../api/astreinteApi';
import { createAstreinte, updateAstreinte } from '../api/astreinteApi';

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

export function AssignAstreinteModal({
    weekNumber, year, startDate, endDate,
    teams, members, existing, onClose, onSaved,
}: AssignAstreinteModalProps) {
    const [teamId, setTeamId] = useState(existing?.teamId ?? (teams[0]?.id ?? ''));
    const [userId, setUserId] = useState(existing?.userId ?? '');
    const [phone,  setPhone]  = useState(existing?.phone  ?? '');
    const [notes,  setNotes]  = useState(existing?.notes  ?? '');
    const [saving, setSaving] = useState(false);
    const [error,  setError]  = useState<string | null>(null);

    const handleSave = async () => {
        if (!userId) return setError('Sélectionnez un membre.');
        setSaving(true);
        setError(null);
        try {
            if (existing) {
                await updateAstreinte(existing.id, { userId, phone: phone || null, notes: notes || null });
            } else {
                await createAstreinte({
                    teamId,
                    userId,
                    weekNumber,
                    year,
                    startDate: startDate.toISOString(),
                    endDate:   endDate.toISOString(),
                    phone:     phone || undefined,
                    notes:     notes || undefined,
                });
            }
            onSaved();
            onClose();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(msg ?? 'Erreur lors de l\'enregistrement.');
        } finally {
            setSaving(false);
        }
    };

    const startLabel = startDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const endLabel   = endDate.toLocaleDateString('fr-FR',   { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal__header">
                    <h3>{existing ? 'Modifier l\'astreinte' : 'Assigner l\'astreinte'}</h3>
                    <button className="modal__close" onClick={onClose}><X size={18} /></button>
                </div>

                <div className="modal__body">
                    <div className="modal-field">
                        <label>Semaine</label>
                        <p className="modal-info">
                            Semaine {weekNumber} — {startLabel} au {endLabel}
                        </p>
                    </div>

                    {!existing && teams.length > 1 && (
                        <div className="modal-field">
                            <label>Équipe</label>
                            <select className="modal-select" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="modal-field">
                        <label>Responsable d'astreinte *</label>
                        <select className="modal-select" value={userId} onChange={(e) => setUserId(e.target.value)}>
                            <option value="">— Choisir un membre —</option>
                            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>

                    <div className="modal-field">
                        <label>Téléphone direct (optionnel)</label>
                        <input
                            className="modal-input"
                            placeholder="+212 6XX XXX XXX"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    <div className="modal-field">
                        <label>Notes / Instructions (optionnel)</label>
                        <textarea
                            className="modal-textarea"
                            rows={3}
                            placeholder="Instructions spéciales pour cette semaine..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    {error && <div className="modal-error">{error}</div>}
                </div>

                <div className="modal__footer">
                    <button className="btn btn--secondary" onClick={onClose}>Annuler</button>
                    <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Enregistrement...' : existing ? 'Mettre à jour' : 'Assigner'}
                    </button>
                </div>
            </div>
        </div>
    );
}
