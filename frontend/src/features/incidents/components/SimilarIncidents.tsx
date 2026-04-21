import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { APP_PATHS } from '../../../app/route-meta';
import { incidentService } from '../api/incident.service';
import type { SimilarIncident } from '../model/incident.types';

interface Props {
    title: string;
}

export const SimilarIncidents = ({ title }: Props) => {
    const [incidents, setIncidents] = useState<SimilarIncident[]>([]);
    const [expanded, setExpanded] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!title || title.length < 3) {
            setIncidents([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const data = await incidentService.findSimilar(title);
                setIncidents(data);
            } catch {
                setIncidents([]);
            } finally {
                setLoading(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [title]);

    if (incidents.length === 0 && !loading) return null;

    const severityColor = (s: string) => {
        switch (s) {
            case 'Critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'High': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
            case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
        }
    };

    return (
        <div className="mt-3 border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 rounded-lg overflow-hidden">
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-100/50 dark:hover:bg-amber-900/20"
            >
                <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {loading ? 'Searching...' : `${incidents.length} similar incident${incidents.length !== 1 ? 's' : ''} found`}
                </div>
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {expanded && (
                <div className="border-t border-amber-200 dark:border-amber-800 divide-y divide-amber-100 dark:divide-amber-800/50">
                    {incidents.map(inc => (
                        <div key={inc.id} className="px-4 py-3 flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                                <Link
                                    to={`${APP_PATHS.incidents}/${inc.id}`}
                                    target="_blank"
                                    className="text-sm font-medium text-primary dark:text-blue-400 hover:underline truncate block"
                                >
                                    {inc.title}
                                </Link>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${severityColor(inc.severity)}`}>
                                        {inc.severity}
                                    </span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{inc.status}</span>
                                    {inc.linkedProcedure && (
                                        <Link
                                            to={`${APP_PATHS.procedures}/${inc.linkedProcedure.id}`}
                                            target="_blank"
                                            className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline"
                                        >
                                            Procedure: {inc.linkedProcedure.title}
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

