import { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
import type { PlanningJob } from '../../../types/planning';
import { planningService } from '../api/planning.service';

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
    const [customTaskName, setCustomTaskName] = useState('');
    const [supportContact, setSupportContact] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [selectedDeps, setSelectedDeps] = useState<string[]>([]);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (!job) {
            return;
        }

        const dateTime = new Date(job.scheduledTime);
        setCustomTaskName(job.customTaskName || '');
        setSupportContact(job.supportContact || '');
        setScheduledDate(dateTime.toISOString().slice(0, 10));
        setScheduledTime(dateTime.toTimeString().slice(0, 5));
        setSelectedDeps(job.dependencies);
        setNotes(job.notes || '');
        setError('');
    }, [job]);

    if (!isOpen || !job) {
        return null;
    }

    const isManual = job.taskType === 'MANUAL_ACTION';
    const otherJobs = existingJobs.filter((existingJob) => existingJob.id !== job.id);

    const toggleDependency = (id: string) => {
        setSelectedDeps((currentDeps) =>
            currentDeps.includes(id) ? currentDeps.filter((depId) => depId !== id) : [...currentDeps, id]
        );
    };

    const handleSave = async () => {
        if (!scheduledDate || !scheduledTime) {
            setError('Date and time are required.');
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

            await planningService.updateJob(job.id, payload);
            onSaved();
            onClose();
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                'Unable to save changes.';
            setError(message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <h2 className="text-base font-semibold text-slate-800">Edit Task</h2>
                    <button onClick={onClose} className="p-1 text-slate-400 transition-colors hover:text-slate-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4 p-6">
                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {isManual && (
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">Task Name</label>
                            <input
                                type="text"
                                value={customTaskName}
                                onChange={(event) => setCustomTaskName(event.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                placeholder="e.g. Close all agencies"
                            />
                        </div>
                    )}

                    {!isManual && (
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">Batch Task</label>
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                                {job.job?.name || '-'} <span className="text-slate-400">/ {job.system?.name}</span>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
                            <input
                                type="date"
                                value={scheduledDate}
                                onChange={(event) => setScheduledDate(event.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">Time</label>
                            <input
                                type="time"
                                value={scheduledTime}
                                onChange={(event) => setScheduledTime(event.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Support Contact</label>
                        <input
                            type="text"
                            value={supportContact}
                            onChange={(event) => setSupportContact(event.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g. central operations"
                        />
                    </div>

                    {otherJobs.length > 0 && (
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Dependencies</label>
                            <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                                {otherJobs.map((existingJob) => (
                                    <label
                                        key={existingJob.id}
                                        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedDeps.includes(existingJob.id)}
                                            onChange={() => toggleDependency(existingJob.id)}
                                            className="accent-indigo-600"
                                        />
                                        <span className="text-slate-700">
                                            {existingJob.customTaskName || existingJob.job?.name || 'Task'}
                                        </span>
                                        <span className="ml-auto text-xs text-slate-400">
                                            {new Date(existingJob.scheduledTime).toLocaleDateString('fr-FR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                            })}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Internal Note (optional)</label>
                        <input
                            type="text"
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            placeholder="Comment or observation"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-6 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => void handleSave()}
                        disabled={saving}
                        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" /> Save
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
