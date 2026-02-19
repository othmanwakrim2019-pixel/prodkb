import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { Plus, Trash2, Upload, X, ShieldAlert } from 'lucide-react';
import { SmartSolutionSearch } from '../components/SmartSolutionSearch';
import { useAuth } from '../context/AuthContext';
import { System, Job, Team, SLA } from '../types';
import { useTranslation } from 'react-i18next';

interface CreateIncidentFormValues {
    title: string;
    description: string;
    environment: string;
    severity: string;
    impact: string;
    detectionSource: string;
    systemId: string;
    jobId: string;
    assignedTeamId: string;
    slaId: string;
    logs: { logType: string; rawLog: string; errorMessage: string }[];
}

export const CreateIncident = () => {
    const { hasPermission } = useAuth();
    const { t } = useTranslation();
    const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateIncidentFormValues>({
        defaultValues: {
            title: '',
            description: '',
            environment: 'PROD',
            severity: 'Medium',
            impact: '',
            detectionSource: '',
            systemId: '',
            jobId: '',
            assignedTeamId: '',
            slaId: '',
            logs: [{ logType: 'raw_log', rawLog: '', errorMessage: '' }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "logs"
    });
    const navigate = useNavigate();
    const [systems, setSystems] = useState<System[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [slas, setSlas] = useState<SLA[]>([]);
    const [attachments, setAttachments] = useState<File[]>([]);

    const selectedSystemId = watch('systemId');
    const selectedJobId = watch('jobId');
    const description = watch('description');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [systemsRes, teamsRes, slasRes] = await Promise.all([
                    axios.get('/api/systems'),
                    axios.get('/api/teams'),
                    axios.get('/api/slas')
                ]);
                setSystems(Array.isArray(systemsRes.data) ? systemsRes.data : systemsRes.data?.data || []);
                setTeams(Array.isArray(teamsRes.data) ? teamsRes.data : teamsRes.data?.data || []);
                setSlas(Array.isArray(slasRes.data) ? slasRes.data : slasRes.data?.data || []);
            } catch (error) {
                console.error('Failed to fetch data', error);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedSystemId) {
            const system = systems.find(s => s.id === selectedSystemId);
            setJobs(system?.jobs || []);
        } else {
            setJobs([]);
        }
    }, [selectedSystemId, systems]);

    // Auto-fill title, team, and SLA from selected job
    useEffect(() => {
        if (selectedJobId && jobs.length > 0) {
            const selectedJob = jobs.find(j => j.id === selectedJobId);
            if (selectedJob) {
                // Auto-fill Team
                if (selectedJob.teamId) {
                    setValue('assignedTeamId', selectedJob.teamId);
                }

                // Auto-fill Title with job name
                setValue('title', selectedJob.name);

                // Auto-fill Description with job code (which serves as description)
                setValue('description', selectedJob.code);
            }
        } else {
            // Clear title if no job selected
            setValue('title', '');
        }
    }, [selectedJobId, jobs, setValue]);

    if (!hasPermission('INCIDENT_CREATE')) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="bg-red-50 p-6 rounded-full mb-4">
                    <ShieldAlert className="h-12 w-12 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{t('common.accessDenied')}</h2>
                <p className="text-slate-600 mt-2 max-w-md">
                    You do not have permission to declare new incidents.
                </p>
            </div>
        );
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setAttachments([...attachments, ...newFiles]);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const onSubmit = async (data: CreateIncidentFormValues) => {
        try {
            // Clean up the data before sending
            const payload = {
                ...data,
                jobId: data.jobId || undefined,
                assignedTeamId: data.assignedTeamId || undefined,
                slaId: data.slaId || undefined,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                logs: data.logs.filter((log: any) => log.rawLog || log.errorMessage),
            };

            // Create the incident first
            const response = await axios.post('/api/incidents', payload);
            const incidentId = response.data.id;

            // Upload attachments if any
            if (attachments.length > 0) {
                for (const file of attachments) {
                    const formData = new FormData();
                    formData.append('file', file);
                    await axios.post(`/api/incidents/${incidentId}/upload`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                }
            }

            navigate('/incidents');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error('Failed to create incident', error);
            // safe check for response
            const responseData = error.response?.data;
            console.error('Error response:', responseData);
            const errorMsg = responseData?.error || responseData?.message || error.message || 'Failed to create incident';
            alert(`Error: ${errorMsg}`);
        }
    };

    if (!hasPermission('INCIDENT_CREATE')) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="bg-red-50 p-6 rounded-full mb-4">
                    <ShieldAlert className="h-12 w-12 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{t('common.accessDenied')}</h2>
                <p className="text-slate-600 mt-2 max-w-md">
                    You do not have permission to declare new incidents.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">{t('createIncident.title')}</h1>
                <p className="text-sm text-slate-500 mt-1">Select the failing component to get started.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-slate-200">

                {/* 1. Context / Component Selection (Top Priority) */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">1. Component Context</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Environment <span className="text-red-500">*</span>
                            </label>
                            <select
                                {...register('environment')}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                            >
                                <option value="PROD">Production</option>
                                <option value="PREPROD">Pre-Production</option>
                                <option value="RECETTE">Recette</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Application (System) <span className="text-red-500">*</span>
                            </label>
                            <select
                                {...register('systemId', { required: 'Application is required' })}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                            >
                                <option value="">Select Application...</option>
                                {systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            {errors.systemId && <p className="text-red-500 text-xs mt-1">{String(errors.systemId.message)}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Uproc (Job)
                            </label>
                            <select
                                {...register('jobId')}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                disabled={!selectedSystemId}
                            >
                                <option value="">Select Uproc...</option>
                                {jobs.map(j => <option key={j.id} value={j.id}>{j.name} ({j.code})</option>)}
                            </select>
                            {!selectedSystemId && <p className="text-xs text-slate-500 mt-1">Select an application first</p>}
                        </div>
                    </div>
                </div>

                {/* 2. Incident Details */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">2. Issue Details</h2>

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
                            placeholder={selectedJobId ? "Auto-filled from selected job" : "e.g. UPROC_NAME or incident description"}
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
                            rows={4}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                            placeholder="Detailed description of what happened..."
                        />
                        {errors.description && <p className="text-red-500 text-xs mt-1">{String(errors.description.message)}</p>}

                        {/* Smart Search Integration */}
                        <SmartSolutionSearch
                            query={description}
                            systemId={selectedSystemId}
                        />
                    </div>
                </div>

                {/* 3. Classification & Assignment */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">3. Assignment & SLA</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Severity <span className="text-red-500">*</span>
                            </label>
                            <select
                                {...register('severity')}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Team</label>
                            <select
                                {...register('assignedTeamId')}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                            >
                                <option value="">No Team Assigned</option>
                                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            <p className="text-xs text-slate-500 mt-1">Auto-filled from Uproc</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">SLA Policy</label>
                            <select
                                {...register('slaId')}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                            >
                                <option value="">No SLA Policy</option>
                                {slas.map(sla => (
                                    <option key={sla.id} value={sla.id}>
                                        {sla.name} ({sla.severity} - {sla.resolveTimeMinutes}min)
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Detection Source</label>
                        <input
                            {...register('detectionSource')}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                            placeholder="e.g. Dollar Universe Console"
                        />
                    </div>
                </div>

                {/* Logs Section */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                        <h2 className="text-lg font-semibold text-slate-900">Logs & Evidence</h2>
                        <button
                            type="button"
                            onClick={() => append({ logType: 'raw_log', rawLog: '', errorMessage: '' })}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-accent bg-blue-100 hover:bg-blue-200 focus:outline-none"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Log Entry
                        </button>
                    </div>

                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="bg-slate-50 p-4 rounded-md border border-slate-200 relative">
                                {fields.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Error Message</label>
                                        <input
                                            {...register(`logs.${index}.errorMessage` as const)}
                                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                            placeholder="Short error message or code"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Raw Log / Stack Trace</label>
                                        <textarea
                                            {...register(`logs.${index}.rawLog` as const)}
                                            rows={3}
                                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border font-mono text-xs"
                                            placeholder="Paste logs, stack traces, or error details here..."
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* File Attachments Section */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">File Attachments</h2>
                    <p className="text-sm text-slate-500 mb-4">
                        Upload log files, screenshots, or any other relevant documents (max 10MB per file)
                    </p>

                    <div className="space-y-4">
                        {/* File Upload Input */}
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 cursor-pointer transition-colors">
                                <Upload className="h-4 w-4" />
                                <span className="text-sm font-medium">Choose Files</span>
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept=".txt,.log,.pdf,.png,.jpg,.jpeg,.json,.xml"
                                />
                            </label>
                            <span className="text-xs text-slate-500">
                                Accepted: .txt, .log, .pdf, .png, .jpg, .json, .xml
                            </span>
                        </div>

                        {/* File List */}
                        {attachments.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-slate-700">Selected Files ({attachments.length})</h3>
                                <div className="space-y-2">
                                    {attachments.map((file, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-200"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="text-slate-400">
                                                    <Upload className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{file.name}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {(file.size / 1024).toFixed(2)} KB
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(index)}
                                                className="text-red-500 hover:text-red-700"
                                                title="Remove file"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                        type="button"
                        onClick={() => navigate('/incidents')}
                        className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
                    >
                        Declare Incident
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateIncident;

