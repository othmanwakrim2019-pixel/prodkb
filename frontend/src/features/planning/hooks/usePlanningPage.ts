import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_PATHS } from '../../../app/route-meta';
import { planningService } from '../api/planning.service';
import { useToast } from '../../../components/ui/Toast';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import type {
    InstanceStatusType,
    PlanningInstance,
    PlanningJob,
    PlanningPeriod,
} from '../../../types/planning';

type ViewMode = 'table' | 'flow';
type FlowDirection = 'LR' | 'TB';

const PLANNING_VIEW_STORAGE_KEY = 'planning_view';
const PLANNING_DIRECTION_STORAGE_KEY = 'planning_direction';

const getStoredViewMode = (): ViewMode => {
    const value = localStorage.getItem(PLANNING_VIEW_STORAGE_KEY);
    return value === 'flow' ? 'flow' : 'table';
};

const getStoredDirection = (): FlowDirection => {
    const value = localStorage.getItem(PLANNING_DIRECTION_STORAGE_KEY);
    return value === 'TB' ? 'TB' : 'LR';
};

export const usePlanningPage = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const { confirm } = useConfirm();

    const [period, setPeriod] = useState<PlanningPeriod>('monthly');
    const [statusFilter, setStatusFilter] = useState<InstanceStatusType | 'all'>('active');
    const [instances, setInstances] = useState<PlanningInstance[]>([]);
    const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
    const [jobs, setJobs] = useState<PlanningJob[]>([]);
    const [loading, setLoading] = useState(false);
    const [instancesError, setInstancesError] = useState<string | null>(null);
    const [jobsError, setJobsError] = useState<string | null>(null);
    const [showAddJob, setShowAddJob] = useState(false);
    const [showCreateInstance, setShowCreateInstance] = useState(false);
    const [showImportCsv, setShowImportCsv] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [editingJob, setEditingJob] = useState<PlanningJob | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>(getStoredViewMode);
    const [direction, setDirection] = useState<FlowDirection>(getStoredDirection);
    const [cloning, setCloning] = useState(false);

    const fetchInstances = useCallback(async () => {
        try {
            setInstancesError(null);
            const nextInstances = await planningService.listInstances({
                period,
                status: statusFilter === 'all' ? undefined : statusFilter,
            });
            setInstances(nextInstances);
        } catch (error) {
            console.error('Failed to fetch planning instances:', error);
            setInstancesError('Failed to load planning instances.');
        }
    }, [period, statusFilter]);

    useEffect(() => {
        void fetchInstances();
    }, [fetchInstances]);

    useEffect(() => {
        const activeInstance = instances.find((instance) => instance.status === 'active');

        if (activeInstance && !selectedInstanceId) {
            setSelectedInstanceId(activeInstance.id);
            return;
        }

        if (instances.length > 0 && !instances.find((instance) => instance.id === selectedInstanceId)) {
            setSelectedInstanceId(instances[0]?.id ?? null);
            return;
        }

        if (instances.length === 0) {
            setSelectedInstanceId(null);
        }
    }, [instances, selectedInstanceId]);

    const fetchJobs = useCallback(async () => {
        if (!selectedInstanceId) {
            setJobs([]);
            setJobsError(null);
            return;
        }

        setLoading(true);

        try {
            setJobsError(null);
            const nextJobs = await planningService.listInstanceJobs(selectedInstanceId);
            setJobs(nextJobs);
        } catch (error) {
            console.error('Failed to fetch planning jobs:', error);
            setJobsError('Failed to load planning jobs.');
        } finally {
            setLoading(false);
        }
    }, [selectedInstanceId]);

    useEffect(() => {
        void fetchJobs();
    }, [fetchJobs]);

    const handleStatusChange = useCallback(async (jobId: string, newStatus: string) => {
        try {
            await planningService.updateJobStatus(jobId, newStatus as PlanningJob['status']);
            await fetchJobs();
        } catch (error) {
            console.error('Failed to update planning job status:', error);
            toast.error('Failed to update job status. The transition may not be allowed.');
        }
    }, [fetchJobs]);

    const handleDelete = useCallback(async (jobId: string) => {
        if (!await confirm('Remove this job from the plan?', 'This action cannot be undone.', 'danger')) {
            return;
        }

        try {
            await planningService.deleteJob(jobId);
            await fetchJobs();
        } catch (error) {
            console.error('Failed to delete planning job:', error);
        }
    }, [confirm, fetchJobs]);

    const handleArchiveInstance = useCallback(async (instanceId: string) => {
        try {
            await planningService.archiveInstance(instanceId);
            await fetchInstances();
        } catch (error) {
            console.error('Failed to archive planning instance:', error);
        }
    }, [fetchInstances]);

    const handleReactivateInstance = useCallback(async (instanceId: string) => {
        try {
            await planningService.reactivateInstance(instanceId);
            await fetchInstances();
        } catch (error) {
            console.error('Failed to reactivate planning instance:', error);
        }
    }, [fetchInstances]);

    const handleDeleteInstance = useCallback(async (instanceId: string) => {
        const shouldDelete = await confirm(
            'Delete this planning instance?',
            'This will permanently delete this planning instance and all its tasks. This cannot be undone.',
            'danger'
        );

        if (!shouldDelete) {
            return;
        }

        try {
            await planningService.deleteInstance(instanceId);

            if (selectedInstanceId === instanceId) {
                setSelectedInstanceId(null);
            }

            await fetchInstances();
        } catch (error) {
            console.error('Failed to delete planning instance:', error);
        }
    }, [confirm, toast, fetchInstances, selectedInstanceId]);

    const handleClone = useCallback(async () => {
        if (!selectedInstanceId) {
            return;
        }

        const shouldClone = await confirm(
            'Clone this planning instance?',
            'Clone this planning instance for next month? All tasks will be reset to Pending.'
        );

        if (!shouldClone) {
            return;
        }

        setCloning(true);

        try {
            const clonedInstance = await planningService.cloneInstance(selectedInstanceId);
            await fetchInstances();

            if (clonedInstance?.id) {
                setSelectedInstanceId(clonedInstance.id);
            }
        } catch (error: unknown) {
            const responseMessage =
                typeof error === 'object' &&
                    error !== null &&
                    'response' in error &&
                    typeof error.response === 'object' &&
                    error.response !== null &&
                    'data' in error.response &&
                    typeof error.response.data === 'object' &&
                    error.response.data !== null &&
                    'message' in error.response.data &&
                    typeof error.response.data.message === 'string'
                    ? error.response.data.message
                    : 'Failed to clone planning instance.';

            toast.error(responseMessage);
        } finally {
            setCloning(false);
        }
    }, [confirm, toast, fetchInstances, selectedInstanceId]);

    const handleCreateIncidentFromJob = useCallback((job: PlanningJob) => {
        const taskName = job.customTaskName || job.job?.name || 'Unknown Task';
        const taskCode = job.job?.code || 'MANUAL';

        navigate(APP_PATHS.incidentNew, {
            state: {
                prefill: {
                    title: `[PLANNING] ${taskName} failed`,
                    systemId: job.systemId || undefined,
                    jobId: job.jobId || undefined,
                    description: `Task "${taskName}" (${taskCode}) scheduled for ${new Date(job.scheduledTime).toLocaleDateString('fr-FR')} has failed during the Fin de Mois procedure.`,
                    severity: 'HIGH',
                },
            },
        });
    }, [navigate]);

    const toggleDirection = useCallback(() => {
        const nextDirection: FlowDirection = direction === 'LR' ? 'TB' : 'LR';
        setDirection(nextDirection);
        localStorage.setItem(PLANNING_DIRECTION_STORAGE_KEY, nextDirection);
    }, [direction]);

    const toggleView = useCallback((mode: ViewMode) => {
        setViewMode(mode);
        localStorage.setItem(PLANNING_VIEW_STORAGE_KEY, mode);
    }, []);

    const selectedInstance = useMemo(
        () => instances.find((instance) => instance.id === selectedInstanceId) ?? null,
        [instances, selectedInstanceId]
    );

    const stats = useMemo(() => ({
        pending: jobs.filter((job) => job.status === 'pending').length,
        running: jobs.filter((job) => job.status === 'running').length,
        done: jobs.filter((job) => job.status === 'done').length,
        failed: jobs.filter((job) => job.status === 'failed').length,
        blocked: jobs.filter((job) => job.status === 'blocked').length,
        total: jobs.length,
    }), [jobs]);

    return {
        period,
        setPeriod,
        statusFilter,
        setStatusFilter,
        instances,
        instancesError,
        selectedInstanceId,
        setSelectedInstanceId,
        selectedInstance,
        jobs,
        jobsError,
        loading,
        stats,
        showAddJob,
        setShowAddJob,
        showCreateInstance,
        setShowCreateInstance,
        showImportCsv,
        setShowImportCsv,
        showHistory,
        setShowHistory,
        editingJob,
        setEditingJob,
        viewMode,
        direction,
        cloning,
        fetchInstances,
        fetchJobs,
        handleStatusChange,
        handleDelete,
        handleArchiveInstance,
        handleReactivateInstance,
        handleDeleteInstance,
        handleClone,
        handleCreateIncidentFromJob,
        toggleDirection,
        toggleView,
    };
};
