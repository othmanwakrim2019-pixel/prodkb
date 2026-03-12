import { useState, useEffect } from 'react';
import type { PlanningJob, CreatePlanningJobPayload, TaskType } from '../../../types/planning';
import type { System, Job } from '../../../types';
import { Cpu, User } from 'lucide-react';
import { planningService } from '../api/planning.service';

interface AddJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
    instanceId: string;
    existingJobs: PlanningJob[];
}

export const AddJobModal = ({ isOpen, onClose, onCreated, instanceId, existingJobs }: AddJobModalProps) => {
    const [systems, setSystems] = useState<System[]>([]);
    const [selectedSystemId, setSelectedSystemId] = useState('');
    const [selectedJobId, setSelectedJobId] = useState('');
    const [customTaskName, setCustomTaskName] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [dependencies, setDependencies] = useState<string[]>([]);
    const [taskType, setTaskType] = useState<TaskType>('BATCH');
    const [supportContact, setSupportContact] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Fetch systems with their jobs
    useEffect(() => {
        if (isOpen) {
            fetchSystems();
            setSelectedSystemId('');
            setSelectedJobId('');
            setCustomTaskName('');
            setScheduledTime('');
            setDependencies([]);
            setTaskType('BATCH');
            setSupportContact('');
            setError('');
        }
    }, [isOpen]);

    const fetchSystems = async () => {
        try {
            const nextSystems = await planningService.listSystems();
            setSystems(Array.isArray(nextSystems) ? nextSystems : []);
        } catch (err) {
            console.error('Failed to fetch systems:', err);
        }
    };

    const selectedSystem = Array.isArray(systems) ? systems.find((system) => system.id === selectedSystemId) : undefined;
    const availableJobs: Job[] = Array.isArray(selectedSystem?.jobs) ? selectedSystem.jobs : [];

    const isBatch = taskType === 'BATCH';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isBatch && (!selectedSystemId || !selectedJobId)) {
            setError('Please select a system and a job for BATCH tasks.');
            return;
        }
        if (!isBatch && !customTaskName.trim()) {
            setError('Please enter a task description for Manual Action.');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const payload: CreatePlanningJobPayload = {
                instanceId,
                scheduledTime: new Date(scheduledTime).toISOString(),
                dependencies,
                taskType,
                supportContact: supportContact.trim() || undefined,
                ...(isBatch
                    ? { systemId: selectedSystemId, jobId: selectedJobId }
                    : { customTaskName: customTaskName.trim() }
                ),
            };
            await planningService.createJob(payload);
            onCreated();
            onClose();
        } catch (err: unknown) {
            console.error('Failed to create planning job:', err);
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(msg || 'Failed to create task. Please check the form.');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleDependency = (jobId: string) => {
        setDependencies(prev =>
            prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800">Add Task to Plan</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-md">{error}</div>
                    )}

                    {/* Task Type Toggle — FIRST so the form adapts */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Task Type</label>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setTaskType('BATCH')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${isBatch
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                    }`}
                            >
                                <Cpu className="w-4 h-4" /> ⚙️ Automated Batch
                            </button>
                            <button
                                type="button"
                                onClick={() => setTaskType('MANUAL_ACTION')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${!isBatch
                                    ? 'border-violet-500 bg-violet-50 text-violet-700'
                                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                    }`}
                            >
                                <User className="w-4 h-4" /> 👤 Manual Action
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5">
                            {isBatch ? '⚙️ Automated job — select system & job below' : '👤 Human task — type the task description below'}
                        </p>
                    </div>

                    {/* --- BATCH: System + Job selectors --- */}
                    {isBatch && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Application / System</label>
                                <select
                                    value={selectedSystemId}
                                    onChange={e => {
                                        setSelectedSystemId(e.target.value);
                                        setSelectedJobId('');
                                    }}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                >
                                    <option value="">— Select a system —</option>
                                    {systems.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Job / Uproc</label>
                                <select
                                    value={selectedJobId}
                                    onChange={e => setSelectedJobId(e.target.value)}
                                    required
                                    disabled={!selectedSystemId}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:opacity-50 disabled:bg-slate-50"
                                >
                                    <option value="">— Select a job —</option>
                                    {availableJobs.map(j => (
                                        <option key={j.id} value={j.id}>{j.name} ({j.code})</option>
                                    ))}
                                </select>
                                {selectedSystemId && availableJobs.length === 0 && (
                                    <p className="text-xs text-slate-400 mt-1 italic">No jobs found for this system.</p>
                                )}
                            </div>
                        </>
                    )}

                    {/* --- MANUAL: Free-text task name --- */}
                    {!isBatch && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Task Description</label>
                            <input
                                type="text"
                                value={customTaskName}
                                onChange={e => setCustomTaskName(e.target.value)}
                                required
                                placeholder={'e.g. "Fermeture de l\'ensemble des Agences"'}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
                            />
                            <p className="text-xs text-slate-400 mt-1">This task won't be linked to a system/job in the application.</p>
                        </div>
                    )}

                    {/* Scheduled Time */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Time</label>
                        <input
                            type="datetime-local"
                            value={scheduledTime}
                            onChange={e => setScheduledTime(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                    </div>

                    {/* Dependencies */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Dependencies ({dependencies.length} selected)
                        </label>
                        {existingJobs.length === 0 ? (
                            <p className="text-sm text-slate-400 italic">No existing jobs to depend on.</p>
                        ) : (
                            <div className="border border-slate-200 rounded-lg max-h-40 overflow-y-auto divide-y divide-slate-100">
                                {existingJobs.map(pj => (
                                    <label
                                        key={pj.id}
                                        className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={dependencies.includes(pj.id)}
                                            onChange={() => toggleDependency(pj.id)}
                                            className="mr-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-medium text-slate-700 truncate block">
                                                {pj.customTaskName || (pj.job ? `${pj.job.name} (${pj.job.code})` : 'Unknown task')}
                                            </span>
                                            <span className="text-xs text-slate-400">{pj.system?.name || 'Manual'}</span>
                                        </div>
                                        <span className={`text-xs px-1.5 py-0.5 rounded ml-2 ${pj.status === 'done' ? 'bg-emerald-100 text-emerald-700' :
                                            pj.status === 'running' ? 'bg-blue-100 text-blue-700' :
                                                'bg-slate-100 text-slate-600'
                                            }`}>
                                            {pj.status}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Support Contact */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Support Contact <span className="text-slate-400 font-normal">(optional)</span></label>
                        <input
                            type="text"
                            value={supportContact}
                            onChange={e => setSupportContact(e.target.value)}
                            placeholder='e.g. "Radouane", "Réseaux et Télécoms"'
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
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
                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${isBatch ? 'bg-blue-600 hover:bg-blue-700' : 'bg-violet-600 hover:bg-violet-700'}`}
                        >
                            {submitting ? 'Adding...' : isBatch ? '⚙️ Add Batch Job' : '👤 Add Manual Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

