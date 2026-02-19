import { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import type { PlanningJob, PlanningPeriod, CreatePlanningJobPayload } from './planning.types';

interface AddJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
    period: PlanningPeriod;
    existingJobs: PlanningJob[];
}

export const AddJobModal = ({ isOpen, onClose, onCreated, period, existingJobs }: AddJobModalProps) => {
    const [form, setForm] = useState<CreatePlanningJobPayload>({
        name: '',
        application: '',
        scheduledTime: '',
        period,
        dependencies: [],
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Reset form when modal opens or period changes
    useEffect(() => {
        if (isOpen) {
            setForm({
                name: '',
                application: '',
                scheduledTime: '',
                period,
                dependencies: [],
            });
            setError('');
        }
    }, [isOpen, period]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const payload: CreatePlanningJobPayload = {
                ...form,
                scheduledTime: new Date(form.scheduledTime).toISOString(),
            };
            await axios.post('/api/planning/jobs', payload);
            onCreated();
            onClose();
        } catch (err) {
            console.error('Failed to create planning job:', err);
            setError('Failed to create job. Please check the form and try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleDependency = (jobId: string) => {
        setForm(prev => ({
            ...prev,
            dependencies: prev.dependencies.includes(jobId)
                ? prev.dependencies.filter(id => id !== jobId)
                : [...prev.dependencies, jobId],
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800">
                        Add Planning Job
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-md">
                            {error}
                        </div>
                    )}

                    {/* Job Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Job Name</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="e.g. Generate Monthly Report"
                        />
                    </div>

                    {/* Application */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Application</label>
                        <input
                            type="text"
                            value={form.application}
                            onChange={e => setForm(prev => ({ ...prev, application: e.target.value }))}
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="e.g. SAP, Oracle, CIH-Core"
                        />
                    </div>

                    {/* Scheduled Time */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Time</label>
                        <input
                            type="datetime-local"
                            value={form.scheduledTime}
                            onChange={e => setForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                    </div>

                    {/* Period (read-only, auto-set from tab) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Period</label>
                        <input
                            type="text"
                            value={period.charAt(0).toUpperCase() + period.slice(1)}
                            readOnly
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm text-slate-500"
                        />
                    </div>

                    {/* Dependencies */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Dependencies ({form.dependencies.length} selected)
                        </label>
                        {existingJobs.length === 0 ? (
                            <p className="text-sm text-slate-400 italic">No existing jobs in this period to depend on.</p>
                        ) : (
                            <div className="border border-slate-200 rounded-lg max-h-40 overflow-y-auto divide-y divide-slate-100">
                                {existingJobs.map(job => (
                                    <label
                                        key={job.id}
                                        className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={form.dependencies.includes(job.id)}
                                            onChange={() => toggleDependency(job.id)}
                                            className="mr-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-medium text-slate-700 truncate block">{job.name}</span>
                                            <span className="text-xs text-slate-400">{job.application}</span>
                                        </div>
                                        <span className={`text-xs px-1.5 py-0.5 rounded ml-2 ${job.status === 'done' ? 'bg-emerald-100 text-emerald-700' :
                                                job.status === 'running' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-slate-100 text-slate-600'
                                            }`}>
                                            {job.status}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {submitting ? 'Creating...' : 'Create Job'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
