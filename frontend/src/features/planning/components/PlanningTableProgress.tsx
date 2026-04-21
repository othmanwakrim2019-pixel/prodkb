import { AlertTriangle } from 'lucide-react';

interface PlanningTableProgressProps {
    totalDone: number;
    totalJobs: number;
    progress: number;
    error: string | null;
}

export const PlanningTableProgress = ({ totalDone, totalJobs, progress, error }: PlanningTableProgressProps) => {
    return (
        <div className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">
                    {totalDone} / {totalJobs} taches terminees
                </span>
                <span className="text-sm font-bold text-slate-700">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {error && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
};
