import { useState } from 'react';

interface ConfirmNoteModalProps {
    jobName: string;
    onConfirm: (note: string) => void;
    onCancel: () => void;
}

export const ConfirmNoteModal = ({ jobName, onConfirm, onCancel }: ConfirmNoteModalProps) => {
    const [note, setNote] = useState('');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <h3 className="mb-1 font-semibold text-slate-800">Confirmer la tache terminee</h3>
                <p className="mb-4 text-sm text-slate-500">
                    <span className="font-medium text-slate-700">{jobName}</span>
                    <br />
                    Veuillez confirmer avec une note de cloture.
                </p>
                <textarea
                    autoFocus
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    className="h-24 w-full resize-none rounded-lg border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder='ex. "Toutes les agences fermees a 18h30"'
                />
                <div className="mt-4 flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={() => onConfirm(note)}
                        disabled={!note.trim()}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                    >
                        Confirmer
                    </button>
                </div>
            </div>
        </div>
    );
};
