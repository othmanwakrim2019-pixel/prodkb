import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { PlanningJob, PlanningStatusType } from '../../../types/planning';

const STATUS_STYLES: Record<string, { bg: string; border: string; badge: string; badgeText: string; text: string }> = {
    pending: {
        bg: 'bg-slate-50',
        border: 'border-slate-300',
        badge: 'bg-slate-200',
        badgeText: 'text-slate-600',
        text: 'text-slate-700',
    },
    running: {
        bg: 'bg-blue-50',
        border: 'border-blue-400',
        badge: 'bg-blue-100',
        badgeText: 'text-blue-700',
        text: 'text-blue-900',
    },
    done: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-400',
        badge: 'bg-emerald-100',
        badgeText: 'text-emerald-700',
        text: 'text-emerald-900',
    },
    failed: {
        bg: 'bg-red-50',
        border: 'border-red-500',
        badge: 'bg-red-100',
        badgeText: 'text-red-700',
        text: 'text-red-900',
    },
    blocked: {
        bg: 'bg-orange-50',
        border: 'border-orange-400',
        badge: 'bg-orange-100',
        badgeText: 'text-orange-700',
        text: 'text-orange-900',
    },
};

interface JobNodeData {
    job: PlanningJob;
    onStatusChange: (id: string, status: PlanningStatusType) => void;
    onDelete: (id: string) => void;
    isBlastBlocked?: boolean;
    blastCount?: number;
}

function JobNodeComponent({ data }: NodeProps & { data: JobNodeData }) {
    const { job, onStatusChange, onDelete, isBlastBlocked, blastCount } = data;
    const effectiveStyle = isBlastBlocked ? 'blocked' : job.status;
    const style = STATUS_STYLES[effectiveStyle] || STATUS_STYLES.pending;
    const [showDropdown, setShowDropdown] = useState(false);

    const scheduledDate = new Date(job.scheduledTime).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    const statusOptions: PlanningStatusType[] = ['pending', 'running', 'done'];

    return (
        <div
            className={`min-w-[230px] max-w-[260px] rounded-lg border-2 shadow-md transition-all duration-200 ${style.bg} ${style.border} ${
                isBlastBlocked ? 'ring-2 ring-orange-300 ring-offset-1' : ''
            } ${job.status === 'failed' ? 'ring-2 ring-red-400 ring-offset-1' : ''}`}
        >
            <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !bg-slate-400" />

            {isBlastBlocked && (
                <div className="animate-pulse rounded-t-md bg-orange-500 py-1 text-center text-[10px] font-bold text-white">
                    BLOCKED - failed dependency
                </div>
            )}

            {job.status === 'failed' && blastCount && blastCount > 0 && (
                <div className="rounded-t-md bg-red-600 py-1 text-center text-[10px] font-bold text-white">
                    Impact: {blastCount} task{blastCount > 1 ? 's' : ''}
                </div>
            )}

            <div className="p-3">
                <div className="mb-2 flex items-center justify-between">
                    <div className="relative">
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className={`cursor-pointer rounded px-2 py-0.5 text-xs font-mono transition-opacity hover:opacity-80 ${style.badgeText} ${style.badge}`}
                            title="Click to change status"
                        >
                            {job.status.toUpperCase()} v
                        </button>
                        {showDropdown && (
                            <div className="absolute left-0 top-full z-50 mt-1 min-w-[100px] rounded-lg border border-slate-200 bg-white shadow-lg">
                                {statusOptions
                                    .filter((status) => status !== job.status)
                                    .map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => {
                                                onStatusChange(job.id, status);
                                                setShowDropdown(false);
                                            }}
                                            className="block w-full px-3 py-1.5 text-left text-xs transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-slate-50"
                                        >
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </button>
                                    ))}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => onDelete(job.id)}
                        className="p-0.5 text-xs text-slate-400 transition-colors hover:text-red-500"
                        title="Delete job"
                    >
                        X
                    </button>
                </div>

                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {job.system?.name ?? job.customTaskName ?? '-'}
                </p>

                <h3 className={`mb-1 text-sm font-semibold leading-tight ${style.text}`}>
                    {job.job?.name ?? job.customTaskName}
                </h3>
                <p className="mb-1 font-mono text-xs text-slate-500">{job.job?.code ?? ''}</p>

                <p className="mb-2 text-xs text-slate-400">Time: {scheduledDate}</p>

                {job.status === 'done' && job.completedBy && (
                    <p className="text-[10px] text-emerald-600">Done by {job.completedBy.name}</p>
                )}

                {job.status === 'running' && (
                    <button
                        onClick={() => onStatusChange(job.id, 'done')}
                        className="mt-1 w-full rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                    >
                        Mark as Done
                    </button>
                )}
            </div>

            <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !bg-slate-400" />
        </div>
    );
}

export const JobNode = memo(JobNodeComponent);
