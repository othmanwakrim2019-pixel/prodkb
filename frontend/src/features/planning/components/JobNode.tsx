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
        <div className={`rounded-lg border-2 shadow-md min-w-[230px] max-w-[260px] ${style.bg} ${style.border} transition-all duration-200 ${isBlastBlocked ? 'ring-2 ring-orange-300 ring-offset-1' : ''} ${job.status === 'failed' ? 'ring-2 ring-red-400 ring-offset-1' : ''}`}>
            <Handle type="target" position={Position.Left} className="!bg-slate-400 !w-2.5 !h-2.5" />

            {/* Blast Radius: blocked banner */}
            {isBlastBlocked && (
                <div className="bg-orange-500 text-white text-[10px] font-bold text-center py-1 rounded-t-md animate-pulse">
                    ⚠ BLOQUÉ — dépendance échouée
                </div>
            )}

            {/* Blast Radius: impact count badge on failed nodes */}
            {job.status === 'failed' && blastCount && blastCount > 0 && (
                <div className="bg-red-600 text-white text-[10px] font-bold text-center py-1 rounded-t-md">
                    💥 {blastCount} tâche{blastCount > 1 ? 's' : ''} impactée{blastCount > 1 ? 's' : ''}
                </div>
            )}

            <div className="p-3">
                {/* Header: Status + Delete */}
                <div className="flex items-center justify-between mb-2">
                    <div className="relative">
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className={`text-xs font-mono ${style.badgeText} ${style.badge} px-2 py-0.5 rounded cursor-pointer hover:opacity-80 transition-opacity`}
                            title="Click to change status"
                        >
                            {job.status.toUpperCase()} ▾
                        </button>
                        {showDropdown && (
                            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-[100px]">
                                {statusOptions
                                    .filter(s => s !== job.status)
                                    .map(s => (
                                        <button
                                            key={s}
                                            onClick={() => {
                                                onStatusChange(job.id, s);
                                                setShowDropdown(false);
                                            }}
                                            className="block w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                                        >
                                            {s.charAt(0).toUpperCase() + s.slice(1)}
                                        </button>
                                    ))}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => onDelete(job.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors text-xs p-0.5"
                        title="Delete job"
                    >
                        ✕
                    </button>
                </div>

                {/* System Name */}
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                    {job.system?.name ?? job.customTaskName ?? '—'}
                </p>

                {/* Job Name + Code */}
                <h3 className={`font-semibold text-sm leading-tight mb-1 ${style.text}`}>
                    {job.job?.name ?? job.customTaskName}
                </h3>
                <p className="text-xs text-slate-500 font-mono mb-1">{job.job?.code ?? ''}</p>

                {/* Scheduled Time */}
                <p className="text-xs text-slate-400 mb-2">
                    🕐 {scheduledDate}
                </p>

                {/* Completion info */}
                {job.status === 'done' && job.completedBy && (
                    <p className="text-[10px] text-emerald-600">
                        ✓ by {job.completedBy.name}
                    </p>
                )}

                {/* Quick "Mark as Done" button for running jobs */}
                {job.status === 'running' && (
                    <button
                        onClick={() => onStatusChange(job.id, 'done')}
                        className="w-full text-xs font-medium py-1.5 px-3 rounded-md
                                   bg-blue-600 text-white hover:bg-blue-700
                                   transition-colors shadow-sm mt-1"
                    >
                        ✓ Mark as Done
                    </button>
                )}
            </div>

            <Handle type="source" position={Position.Right} className="!bg-slate-400 !w-2.5 !h-2.5" />
        </div>
    );
}

export const JobNode = memo(JobNodeComponent);

