import { useEffect, useState } from 'react';
import { Cpu, User } from 'lucide-react';
import type { Job, System } from '../../../types';
import type { CreatePlanningJobPayload, PlanningJob, TaskType } from '../model/planning';
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

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        void fetchSystems();
        setSelectedSystemId('');
        setSelectedJobId('');
        setCustomTaskName('');
        setScheduledTime('');
        setDependencies([]);
        setTaskType('BATCH');
        setSupportContact('');
        setError('');
    }, [isOpen]);

    const fetchSystems = async () => {
        try {
            const nextSystems = await planningService.listSystems();
            setSystems(Array.isArray(nextSystems) ? nextSystems : []);
        } catch (err) {
            console.error('Failed to fetch systems:', err);
        }
    };

    const selectedSystem = systems.find((system) => system.id === selectedSystemId);
    const availableJobs: Job[] = Array.isArray(selectedSystem?.jobs) ? selectedSystem.jobs : [];
    const isBatch = taskType === 'BATCH';

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (isBatch && (!selectedSystemId || !selectedJobId)) {
            setError('Please select a system and a job for batch tasks.');
            return;
        }

        if (!isBatch && !customTaskName.trim()) {
            setError('Please enter a task description for manual action.');
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
                    : { customTaskName: customTaskName.trim() }),
            };

            await planningService.createJob(payload);
            onCreated();
            onClose();
        } catch (err: unknown) {
            console.error('Failed to create planning job:', err);
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(message || 'Failed to create task. Please check the form.');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleDependency = (jobId: string) => {
        setDependencies((currentDependencies) =>
            currentDependencies.includes(jobId)
                ? currentDependencies.filter((id) => id !== jobId)
                : [...currentDependencies, jobId]
        );
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-slate-800">Add Task to Plan</h2>
                    <button onClick={onClose} className="text-slate-400 transition-colors hover:text-slate-600">
                        X
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 p-6">
                    {error && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Task Type</label>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setTaskType('BATCH')}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 py-2.5 text-sm font-medium transition-all ${
                                    isBatch
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                }`}
                            >
                                <Cpu className="h-4 w-4" /> Automated Batch
                            </button>
                            <button
                                type="button"
                                onClick={() => setTaskType('MANUAL_ACTION')}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 py-2.5 text-sm font-medium transition-all ${
                                    !isBatch
                                        ? 'border-violet-500 bg-violet-50 text-violet-700'
                                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                }`}
                            >
                                <User className="h-4 w-4" /> Manual Action
                            </button>
                        </div>
                        <p className="mt-1.5 text-xs text-slate-400">
                            {isBatch
                                ? 'Automated job: select system and job below.'
                                : 'Human task: type the task description below.'}
                        </p>
                    </div>

                    {isBatch && (
                        <>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Application / System</label>
                                <select
                                    value={selectedSystemId}
                                    onChange={(event) => {
                                        setSelectedSystemId(event.target.value);
                                        setSelectedJobId('');
                                    }}
                                    required
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select a system</option>
                                    {systems.map((system) => (
                                        <option key={system.id} value={system.id}>
                                            {system.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Job / Uproc</label>
                                <select
                                    value={selectedJobId}
                                    onChange={(event) => setSelectedJobId(event.target.value)}
                                    required
                                    disabled={!selectedSystemId}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:opacity-50"
                                >
                                    <option value="">Select a job</option>
                                    {availableJobs.map((job) => (
                                        <option key={job.id} value={job.id}>
                                            {job.name} ({job.code})
                                        </option>
                                    ))}
                                </select>
                                {selectedSystemId && availableJobs.length === 0 && (
                                    <p className="mt-1 text-xs italic text-slate-400">No jobs found for this system.</p>
                                )}
                            </div>
                        </>
                    )}

                    {!isBatch && (
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">Task Description</label>
                            <input
                                type="text"
                                value={customTaskName}
                                onChange={(event) => setCustomTaskName(event.target.value)}
                                required
                                placeholder='e.g. "Close all agencies"'
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500"
                            />
                            <p className="mt-1 text-xs text-slate-400">
                                This task will not be linked to a system or job in the application.
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Scheduled Time</label>
                        <input
                            type="datetime-local"
                            value={scheduledTime}
                            onChange={(event) => setScheduledTime(event.target.value)}
                            required
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Dependencies ({dependencies.length} selected)
                        </label>
                        {existingJobs.length === 0 ? (
                            <p className="text-sm italic text-slate-400">No existing jobs to depend on.</p>
                        ) : (
                            <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200">
                                {existingJobs.map((planningJob) => (
                                    <label
                                        key={planningJob.id}
                                        className="flex cursor-pointer items-center px-3 py-2 transition-colors hover:bg-slate-50"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={dependencies.includes(planningJob.id)}
                                            onChange={() => toggleDependency(planningJob.id)}
                                            className="mr-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-medium text-slate-700">
                                                {planningJob.customTaskName || (planningJob.job ? `${planningJob.job.name} (${planningJob.job.code})` : 'Unknown task')}
                                            </span>
                                            <span className="text-xs text-slate-400">{planningJob.system?.name || 'Manual'}</span>
                                        </div>
                                        <span
                                            className={`ml-2 rounded px-1.5 py-0.5 text-xs ${
                                                planningJob.status === 'done'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : planningJob.status === 'running'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-slate-100 text-slate-600'
                                            }`}
                                        >
                                            {planningJob.status}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Support Contact <span className="font-normal text-slate-400">(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={supportContact}
                            onChange={(event) => setSupportContact(event.target.value)}
                            placeholder='e.g. "Operations team"'
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
                                isBatch ? 'bg-blue-600 hover:bg-blue-700' : 'bg-violet-600 hover:bg-violet-700'
                            }`}
                        >
                            {submitting ? 'Adding...' : isBatch ? 'Add Batch Job' : 'Add Manual Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
