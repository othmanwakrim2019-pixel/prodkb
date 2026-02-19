import { useState, useEffect, useCallback } from 'react';
import axios from '../../utils/axios';
import { PlanningFlow } from './PlanningFlow';
import { AddJobModal } from './AddJobModal';
import type { PlanningJob, PlanningPeriod } from './planning.types';

const PERIODS: { key: PlanningPeriod; label: string }[] = [
    { key: 'monthly', label: 'Monthly' },
    { key: 'quarterly', label: 'Quarterly' },
    { key: 'annual', label: 'Annual' },
];

export const Planning = () => {
    const [activePeriod, setActivePeriod] = useState<PlanningPeriod>('monthly');
    const [jobs, setJobs] = useState<PlanningJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/planning/jobs?period=${activePeriod}`);
            setJobs(res.data || []);
        } catch (err) {
            console.error('Failed to fetch planning jobs:', err);
            setJobs([]);
        } finally {
            setLoading(false);
        }
    }, [activePeriod]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    const handleComplete = useCallback(async (jobId: string) => {
        try {
            await axios.patch(`/api/planning/jobs/${jobId}/complete`);
            await fetchJobs();
        } catch (err) {
            console.error('Failed to complete job:', err);
            alert('Failed to mark job as done. Please try again.');
        }
    }, [fetchJobs]);

    const handleDelete = useCallback(async (jobId: string) => {
        const job = jobs.find(j => j.id === jobId);
        if (!confirm(`Delete job "${job?.name || jobId}"?`)) return;

        try {
            await axios.delete(`/api/planning/jobs/${jobId}`);
            await fetchJobs();
        } catch (err) {
            console.error('Failed to delete job:', err);
            alert('Failed to delete job. Please try again.');
        }
    }, [jobs, fetchJobs]);

    // Stats
    const stats = {
        total: jobs.length,
        pending: jobs.filter(j => j.status === 'pending').length,
        running: jobs.filter(j => j.status === 'running').length,
        done: jobs.filter(j => j.status === 'done').length,
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Planning & Job Scheduling</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Visualize job execution chains and track progress across periods.
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium
                               text-white bg-blue-600 rounded-lg hover:bg-blue-700
                               transition-colors shadow-sm"
                >
                    <span className="text-lg leading-none">+</span>
                    Add Job
                </button>
            </div>

            {/* Period Tabs + Stats */}
            <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 shadow-sm px-2 py-2">
                <div className="flex gap-1">
                    {PERIODS.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setActivePeriod(key)}
                            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${activePeriod === key
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Status Summary */}
                {!loading && jobs.length > 0 && (
                    <div className="flex items-center gap-4 pr-3 text-xs">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                            <span className="text-slate-500">{stats.pending} Pending</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-slate-500">{stats.running} Running</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-slate-500">{stats.done} Done</span>
                        </span>
                    </div>
                )}
            </div>

            {/* Flow Graph */}
            {loading ? (
                <div className="flex items-center justify-center h-[500px] text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
                        <span className="text-sm">Loading jobs...</span>
                    </div>
                </div>
            ) : (
                <PlanningFlow
                    jobs={jobs}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                />
            )}

            {/* Add Job Modal */}
            <AddJobModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onCreated={fetchJobs}
                period={activePeriod}
                existingJobs={jobs}
            />
        </div>
    );
};
