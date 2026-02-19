import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { PlanningJob } from './planning.types';

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
};

interface JobNodeData {
    job: PlanningJob;
    onComplete: (id: string) => void;
    onDelete: (id: string) => void;
}

function JobNodeComponent({ data }: NodeProps & { data: JobNodeData }) {
    const { job, onComplete, onDelete } = data;
    const style = STATUS_STYLES[job.status] || STATUS_STYLES.pending;

    const scheduledDate = new Date(job.scheduledTime).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div
            className={`rounded-lg border-2 shadow-md min-w-[220px] ${style.bg} ${style.border} transition-all duration-200`}
        >
            <Handle type="target" position={Position.Left} className="!bg-slate-400 !w-2 !h-2" />

            <div className="p-3">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-mono ${style.badgeText} ${style.badge} px-1.5 py-0.5 rounded`}>
                        {job.status.toUpperCase()}
                    </span>
                    <button
                        onClick={() => onDelete(job.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors text-xs p-0.5"
                        title="Delete job"
                    >
                        ✕
                    </button>
                </div>

                {/* Job Name */}
                <h3 className={`font-semibold text-sm leading-tight mb-1 ${style.text}`}>
                    {job.name}
                </h3>

                {/* Application */}
                <p className="text-xs text-slate-500 mb-1">
                    <span className="font-medium">App:</span> {job.application}
                </p>

                {/* Scheduled Time */}
                <p className="text-xs text-slate-400 mb-2">
                    🕐 {scheduledDate}
                </p>

                {/* Mark as Done Button — only for running jobs */}
                {job.status === 'running' && (
                    <button
                        onClick={() => onComplete(job.id)}
                        className="w-full text-xs font-medium py-1.5 px-3 rounded-md
                                   bg-blue-600 text-white hover:bg-blue-700
                                   transition-colors shadow-sm"
                    >
                        ✓ Mark as Done
                    </button>
                )}
            </div>

            <Handle type="source" position={Position.Right} className="!bg-slate-400 !w-2 !h-2" />
        </div>
    );
}

export const JobNode = memo(JobNodeComponent);
