import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { SmartSolutionSearch } from '../components/SmartSolutionSearch';
import { SimilarIncidents } from '../components/SimilarIncidents';
import { LogEntryFields } from '../components/LogEntryFields';
import { FileAttachmentSection } from '../components/FileAttachmentSection';
import { useAuth } from '../../../context/AuthContext';
import { System, Job, Team, SLA } from '../../../types';
import { useTranslation } from 'react-i18next';
import { APP_PATHS } from '../../../app/route-meta';
import { incidentService } from '../api/incident.service';
import { useToast } from '../../../components/ui/Toast';
import type { CreateIncidentFormValues } from '../model/incident.types';

export const CreateIncidentPage = () => {
    const { hasPermission } = useAuth();
    const { t } = useTranslation();
    const toast = useToast();
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
    const watchTitle = watch('title');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const formOptions = await incidentService.getFormOptions();
                setSystems(formOptions.systems);
                setTeams(formOptions.teams);
                setSlas(formOptions.slas);
            } catch (error) {
                console.error('Failed to fetch data', error);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedSystemId) {
            setJobs(incidentService.getSystemJobs(selectedSystemId, systems));
        } else {
            setJobs([]);
        }
    }, [selectedSystemId, systems]);

    useEffect(() => {
        if (selectedJobId && jobs.length > 0) {
            const selectedJob = jobs.find(j => j.id === selectedJobId);
            if (selectedJob) {
                if (selectedJob.teamId) setValue('assignedTeamId', selectedJob.teamId);
                setValue('title', selectedJob.name);
                setValue('description', selectedJob.code);
            }
        } else {
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
            const payload = {
                ...data,
                jobId: data.jobId || undefined,
                assignedTeamId: data.assignedTeamId || undefined,
                slaId: data.slaId || undefined,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                logs: data.logs.filter((log: any) => log.rawLog || log.errorMessage),
            };

            const incident = await incidentService.create(payload);
            const incidentId = incident.id;

            if (attachments.length > 0) {
                for (const file of attachments) {
                    const formData = new FormData();
                    formData.append('file', file);
                    await incidentService.uploadFile(incidentId, formData);
                }
            }

            navigate(APP_PATHS.incidents);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error('Failed to create incident', error);
            const responseData = error.response?.data;
            const errorMsg = responseData?.error || responseData?.message || error.message || 'Failed to create incident';
            toast.error(errorMsg);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">{t('createIncident.title')}</h1>
                <p className="text-sm text-slate-500 mt-1">{t('common.selectApplicationFirst')}</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-slate-200">

                {/* 1. Context / Component Selection */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">1. {t('common.componentContext')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                {t('common.environment')} <span className="text-red-500">*</span>
                            </label>
                            <select {...register('environment')} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border">
                                <option value="PROD">{t('common.production')}</option>
                                <option value="PREPROD">{t('common.preProduction')}</option>
                                <option value="RECETTE">{t('common.recette')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                {t('common.application')} ({t('common.system')}) <span className="text-red-500">*</span>
                            </label>
                            <select {...register('systemId', { required: 'Application is required' })} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border">
                                <option value="">{t('common.selectApplication')}</option>
                                {systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            {errors.systemId && <p className="text-red-500 text-xs mt-1">{String(errors.systemId.message)}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Uproc (Job)</label>
                            <select {...register('jobId')} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border" disabled={!selectedSystemId}>
                                <option value="">{t('common.selectUproc')}</option>
                                {jobs.map(j => <option key={j.id} value={j.id}>{j.name} ({j.code})</option>)}
                            </select>
                            {!selectedSystemId && <p className="text-xs text-slate-500 mt-1">{t('common.selectApplicationFirst')}</p>}
                        </div>
                    </div>
                </div>

                {/* 2. Incident Details */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">2. {t('common.issueDetails')}</h2>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            UPROC {!selectedJobId && <span className="text-red-500">*</span>}
                            {selectedJobId && <span className="text-slate-400 text-xs ml-1">({t('common.autoFilledFromJob')})</span>}
                        </label>
                        <input
                            {...register('title', { required: selectedJobId ? false : 'UPROC is required when no job is selected' })}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                            placeholder={selectedJobId ? t('common.autoFilledFromUproc') : ""}
                            disabled={!!selectedJobId}
                        />
                        {errors.title && <p className="text-red-500 text-xs mt-1">{String(errors.title.message)}</p>}
                        <SimilarIncidents title={watchTitle} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea {...register('description', { required: t('createIncident.descriptionRequired') })} rows={4} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border" placeholder={t('common.detailedDescription')} />
                        {errors.description && <p className="text-red-500 text-xs mt-1">{String(errors.description.message)}</p>}
                        <SmartSolutionSearch query={description} systemId={selectedSystemId} />
                    </div>
                </div>

                {/* 3. Classification & Assignment */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">3. {t('common.assignmentSLA')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Severity <span className="text-red-500">*</span></label>
                            <select {...register('severity')} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border">
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Team</label>
                            <select {...register('assignedTeamId')} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border">
                                <option value="">{t('common.noTeamAssigned')}</option>
                                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            <p className="text-xs text-slate-500 mt-1">{t('common.autoFilledNote')}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">SLA Policy</label>
                            <select {...register('slaId')} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border">
                                <option value="">{t('common.noSlaPolicy')}</option>
                                {slas.map(sla => (
                                    <option key={sla.id} value={sla.id}>
                                        {sla.name} ({sla.severity} - {sla.resolveTimeMinutes}min)
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.detectionSource')}</label>
                        <input {...register('detectionSource')} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border" placeholder={t('common.detectionPlaceholder')} />
                    </div>
                </div>

                {/* Logs Section — extracted component */}
                <LogEntryFields fields={fields} register={register} append={append} remove={remove} />

                {/* File Attachments — extracted component */}
                <FileAttachmentSection attachments={attachments} onFileChange={handleFileChange} onRemove={removeAttachment} />

                {/* Submit */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button type="button" onClick={() => navigate(APP_PATHS.incidents)} className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none">
                        {t('common.cancel')}
                    </button>
                    <button type="submit" className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent">
                        {t('common.declareIncident')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateIncidentPage;


