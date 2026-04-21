import { useState } from 'react';
import type { PlanningJob, PlanningStatusType } from '../model/planning';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import { planningService } from '../api/planning.service';
import { ConfirmNoteModal } from './ConfirmNoteModal';
import { PlanningTableProgress } from './PlanningTableProgress';
import { PlanningTableHeader } from './PlanningTableHeader';
import { PlanningTableRow } from './PlanningTableRow';

interface Props {
    jobs: PlanningJob[];
    instanceStatus: 'active' | 'archived';
    onRefresh: () => void;
    onCreateIncident?: (job: PlanningJob) => void;
    onEditJob?: (job: PlanningJob) => void;
}

export const PlanningTableView = ({ jobs, instanceStatus, onRefresh, onCreateIncident, onEditJob }: Props) => {
    const [confirmJob, setConfirmJob] = useState<PlanningJob | null>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { confirm } = useConfirm();

    const sortedJobs = [...jobs].sort(
        (left, right) => new Date(left.scheduledTime).getTime() - new Date(right.scheduledTime).getTime()
    );

    const clearErrorSoon = () => {
        setTimeout(() => setError(null), 5000);
    };

    const updateStatus = async (job: PlanningJob, newStatus: PlanningStatusType, notes?: string) => {
        setLoadingId(job.id);
        setError(null);

        try {
            await planningService.updateJobStatus(job.id, newStatus, notes);
            onRefresh();
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                'Impossible de mettre a jour le statut.';
            setError(message);
            clearErrorSoon();
        } finally {
            setLoadingId(null);
        }
    };

    const handleDelete = async (job: PlanningJob) => {
        const taskLabel = job.customTaskName || job.job?.name || 'cette tache';
        const shouldDelete = await confirm(
            `Supprimer "${taskLabel}" ?`,
            'Cette action est irreversible.',
            'danger'
        );

        if (!shouldDelete) {
            return;
        }

        setLoadingId(job.id);

        try {
            await planningService.deleteJob(job.id);
            onRefresh();
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                'Impossible de supprimer la tache.';
            setError(message);
            clearErrorSoon();
        } finally {
            setLoadingId(null);
        }
    };

    const handleMarkDone = (job: PlanningJob) => {
        if (job.taskType === 'MANUAL_ACTION') {
            setConfirmJob(job);
            return;
        }

        void updateStatus(job, 'done');
    };

    const totalDone = jobs.filter((job) => job.status === 'done').length;
    const progress = jobs.length > 0 ? Math.round((totalDone / jobs.length) * 100) : 0;
    const isEditable = instanceStatus === 'active';

    return (
        <div className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 overflow-hidden">
            <PlanningTableProgress
                totalDone={totalDone}
                totalJobs={jobs.length}
                progress={progress}
                error={error}
            />

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                    <PlanningTableHeader isEditable={isEditable} />
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                        {sortedJobs.map((job, index) => (
                            <PlanningTableRow
                                key={job.id}
                                job={job}
                                index={index}
                                isEditable={isEditable}
                                loadingId={loadingId}
                                onUpdateStatus={updateStatus}
                                onMarkDone={handleMarkDone}
                                onDelete={handleDelete}
                                onCreateIncident={onCreateIncident}
                                onEditJob={onEditJob}
                            />
                        ))}
                    </tbody>
                </table>

                {sortedJobs.length === 0 && (
                    <div className="py-12 text-center text-sm text-slate-400">
                        Aucune tache dans cette instance de planning.
                    </div>
                )}
            </div>

            {confirmJob && (
                <ConfirmNoteModal
                    jobName={confirmJob.customTaskName || confirmJob.job?.name || 'Tache'}
                    onConfirm={(note) => {
                        void updateStatus(confirmJob, 'done', note);
                        setConfirmJob(null);
                    }}
                    onCancel={() => setConfirmJob(null)}
                />
            )}
        </div>
    );
};
