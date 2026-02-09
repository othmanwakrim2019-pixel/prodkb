import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import axios from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export const CreateProcedure = () => {
    const { hasPermission } = useAuth();
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        defaultValues: {
            title: '',
            description: '',
            rootCause: '',
            resolutionSteps: '',
            workaround: '',
            commands: '',
            errorCode: '',
            tags: '',
            systemId: '',
            jobId: '',
        }
    });
    const navigate = useNavigate();
    const [systems, setSystems] = useState<any[]>([]);
    const [jobs, setJobs] = useState<any[]>([]);
    const [targetJobId, setTargetJobId] = useState<string | null>(null);

    const { id } = useParams();
    const isEditMode = !!id;

    // Permission check
    if (!hasPermission(isEditMode ? 'PROCEDURE_EDIT' : 'PROCEDURE_CREATE')) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="bg-red-50 p-6 rounded-full mb-4">
                    <ShieldAlert className="h-12 w-12 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Access Denied</h2>
                <p className="text-slate-600 mt-2 max-w-md">
                    You do not have permission to {isEditMode ? 'edit' : 'create'} procedures. Please contact your administrator if you believe this is an error.
                </p>
            </div>
        );
    }

    const selectedSystemId = watch('systemId');
    const selectedJobId = watch('jobId');

    useEffect(() => {
        const fetchSystems = async () => {
            try {
                const response = await axios.get('/api/systems');
                setSystems(response.data);
            } catch (error) {
                console.error('Failed to fetch systems', error);
            }
        };
        fetchSystems();
    }, []);

    useEffect(() => {
        if (selectedSystemId) {
            const system = systems.find(s => s.id === selectedSystemId);
            setJobs(system?.jobs || []);
        } else {
            setJobs([]);
        }
    }, [selectedSystemId, systems]);

    // Set job ID once jobs are loaded
    useEffect(() => {
        if (jobs.length > 0 && targetJobId) {
            setValue('jobId', targetJobId);
            // We don't nullify targetJobId immediately to avoid race conditions, 
            // but we should probably clear it if we want to allow user to change it without overwriting?
            // Actually, if we set it once, it's done. 
            // But if systems change, jobs change.
            // Let's clear it.
            setTargetJobId(null);
        }
    }, [jobs, targetJobId, setValue]);

    // Fetch procedure data if in edit mode
    useEffect(() => {
        if (isEditMode) {
            const fetchProcedure = async () => {
                try {
                    const response = await axios.get(`/api/procedures/${id}`);
                    const procedure = response.data;

                    setValue('title', procedure.title);
                    setValue('description', procedure.description);
                    setValue('systemId', procedure.systemId);

                    if (procedure.jobId) setTimeout(() => setValue('jobId', procedure.jobId), 500);

                    setValue('errorCode', procedure.errorCode || '');
                    setValue('tags', procedure.tags || '');
                    setValue('rootCause', procedure.rootCause || '');
                    setValue('resolutionSteps', procedure.resolutionSteps);
                    setValue('workaround', procedure.workaround || '');
                    setValue('commands', procedure.commands || '');

                } catch (error) {
                    console.error('Failed to fetch procedure', error);
                    alert('Failed to load procedure details.');
                    navigate('/procedures');
                }
            };
            fetchProcedure();
        }
    }, [isEditMode, id, setValue, navigate]);

    // Auto-fill title from selected job
    useEffect(() => {
        if (!isEditMode && selectedJobId && jobs.length > 0) {
            const selectedJob = jobs.find(j => j.id === selectedJobId);
            if (selectedJob) {
                setValue('title', selectedJob.name);
            }
        }
        // In edit mode or if no job, we rely on existing title or user input
    }, [selectedJobId, jobs, setValue, isEditMode]);

    const [searchParams] = useSearchParams();
    const fromIncidentId = searchParams.get('fromIncident');

    useEffect(() => {
        if (!isEditMode && fromIncidentId) {
            const fetchIncident = async () => {
                try {
                    const response = await axios.get(`/api/incidents/${fromIncidentId}`);
                    const incident = response.data;

                    setValue('title', `Resolution: ${incident.title || ''}`);
                    setValue('description', `Generated from Incident #${incident.id}. Original issue: ${incident.description || ''}`);

                    if (incident.systemId) setValue('systemId', incident.systemId);
                    if (incident.jobId) setTargetJobId(incident.jobId);

                    // Compile resolution steps from logs and find error code
                    const resolutionLogs = incident.logs?.filter((l: any) => l.logType === 'resolution' || l.logType === 'investigation') || [];
                    const steps = resolutionLogs.map((l: any) => `[${l.logType.toUpperCase()}] ${l.rawLog}`).join('\n\n');
                    setValue('resolutionSteps', steps || 'No resolution logs found in incident.');

                    // Find first error code
                    const logWithErrorCode = incident.logs?.find((l: any) => l.errorCode);
                    if (logWithErrorCode) {
                        setValue('errorCode', logWithErrorCode.errorCode);
                    }

                } catch (error) {
                    console.error('Failed to fetch incident for auto-fill', error);
                }
            };
            fetchIncident();
        }
    }, [fromIncidentId, setValue]);

    const onSubmit = async (data: any) => {
        try {
            const payload = {
                ...data,
                jobId: data.jobId || undefined,
            };
            if (isEditMode) {
                await axios.put(`/api/procedures/${id}`, payload);
            } else {
                const response = await axios.post('/api/procedures', payload);
                const newProcedure = response.data;

                if (fromIncidentId && newProcedure.id) {
                    try {
                        await axios.post(`/api/incidents/${fromIncidentId}/link-procedure/${newProcedure.id}`);
                    } catch (linkError) {
                        console.error('Failed to link procedure to incident', linkError);
                        alert('Procedure created, but failed to link to incident.');
                    }
                }
            }

            navigate('/procedures');
        } catch (error: any) {
            console.error('Failed to create procedure', error);
            alert(error.response?.data?.error || 'Failed to create procedure');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">{isEditMode ? 'Edit Procedure' : 'Create New Procedure'}</h1>
                <p className="text-sm text-slate-500 mt-1">Document a solution for future reference</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                {/* Basic Info */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Basic Information</h2>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            UPROC {!selectedJobId && <span className="text-red-500">*</span>}
                            {selectedJobId && <span className="text-slate-400 text-xs ml-1">(auto-filled from job)</span>}
                        </label>
                        <input
                            {...register('title', {
                                required: selectedJobId ? false : 'UPROC is required when no job is selected'
                            })}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                            placeholder={selectedJobId ? "Auto-filled from selected job" : "e.g. UPROC_NAME or procedure description"}
                            disabled={!!selectedJobId}
                        />
                        {errors.title && <p className="text-red-500 text-xs mt-1">{String(errors.title.message)}</p>}
                        {!selectedJobId && <p className="text-xs text-slate-500 mt-1">If you can't find the right job above, enter the UPROC name here</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            {...register('description', { required: 'Description is required' })}
                            rows={3}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                            placeholder="Brief overview of the issue and solution..."
                        />
                        {errors.description && <p className="text-red-500 text-xs mt-1">{String(errors.description.message)}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                System <span className="text-red-500">*</span>
                            </label>
                            <select
                                {...register('systemId', { required: 'System is required' })}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                            >
                                <option value="">Select System</option>
                                {systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            {errors.systemId && <p className="text-red-500 text-xs mt-1">{String(errors.systemId.message)}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Job / Uproc (Optional)</label>
                            <select
                                {...register('jobId')}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                disabled={!selectedSystemId}
                            >
                                <option value="">Select Job</option>
                                {jobs.map(j => <option key={j.id} value={j.id}>{j.name} ({j.code})</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Error Code (Optional)</label>
                            <input
                                {...register('errorCode')}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                placeholder="e.g. ERR-500, TIMEOUT"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tags (Optional)</label>
                            <input
                                {...register('tags')}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                placeholder="e.g. batch, payment, timeout (comma-separated)"
                            />
                        </div>
                    </div>
                </div>

                {/* Solution Details */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Solution Details</h2>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Root Cause (Optional)</label>
                        <textarea
                            {...register('rootCause')}
                            rows={3}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                            placeholder="What caused this issue..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Resolution Steps <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            {...register('resolutionSteps', { required: 'Resolution steps are required' })}
                            rows={6}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                            placeholder="Step-by-step instructions to resolve this issue..."
                        />
                        {errors.resolutionSteps && <p className="text-red-500 text-xs mt-1">{String(errors.resolutionSteps.message)}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Workaround (Optional)</label>
                        <textarea
                            {...register('workaround')}
                            rows={3}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                            placeholder="Temporary workaround if full resolution isn't possible..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Commands / Scripts (Optional)</label>
                        <textarea
                            {...register('commands')}
                            rows={4}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border font-mono text-xs"
                            placeholder="SQL queries, shell commands, or scripts..."
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                        type="button"
                        onClick={() => navigate('/procedures')}
                        className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
                    >
                        {isEditMode ? 'Save Changes' : 'Create Procedure'}
                    </button>
                </div>
            </form>
        </div>
    );
};
