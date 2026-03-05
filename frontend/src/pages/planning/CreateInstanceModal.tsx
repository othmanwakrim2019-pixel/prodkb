import { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import type { CreateInstancePayload, PlanningPeriod } from '../../types/planning';

interface CreateInstanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
    period: PlanningPeriod;
}

export const CreateInstanceModal = ({ isOpen, onClose, onCreated, period }: CreateInstanceModalProps) => {
    const [form, setForm] = useState<CreateInstancePayload>({
        name: '',
        description: '',
        period,
        startDate: '',
        endDate: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Auto-generate name based on period & current date
            const now = new Date();
            const monthName = now.toLocaleString('en-US', { month: 'long' });
            const year = now.getFullYear();

            let autoName = '';
            let start = '';
            let end = '';

            if (period === 'monthly') {
                autoName = `${monthName} ${year} Monthly`;
                start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 16);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59).toISOString().slice(0, 16);
            } else if (period === 'quarterly') {
                const q = Math.floor(now.getMonth() / 3) + 1;
                autoName = `Q${q} ${year} Quarterly`;
                start = new Date(now.getFullYear(), (q - 1) * 3, 1).toISOString().slice(0, 16);
                end = new Date(now.getFullYear(), q * 3, 0, 23, 59).toISOString().slice(0, 16);
            } else {
                autoName = `${year} Annual`;
                start = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 16);
                end = new Date(now.getFullYear(), 11, 31, 23, 59).toISOString().slice(0, 16);
            }

            setForm({
                name: autoName,
                description: '',
                period,
                startDate: start,
                endDate: end,
            });
            setError('');
        }
    }, [isOpen, period]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            await axios.post('/api/v1/planning/instances', {
                ...form,
                startDate: new Date(form.startDate).toISOString(),
                endDate: new Date(form.endDate).toISOString(),
            });
            onCreated();
            onClose();
        } catch (err) {
            console.error('Failed to create instance:', err);
            setError('Failed to create planning instance.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800">New Planning Instance</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-md">{error}</div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Instance Name</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            rows={2}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Period</label>
                        <input
                            type="text"
                            value={period.charAt(0).toUpperCase() + period.slice(1)}
                            readOnly
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm text-slate-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                            <input
                                type="datetime-local"
                                value={form.startDate}
                                onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                            <input
                                type="datetime-local"
                                value={form.endDate}
                                onChange={e => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                        </div>
                    </div>

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
                            {submitting ? 'Creating...' : 'Create Instance'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

