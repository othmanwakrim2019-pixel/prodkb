import { useState, useEffect } from 'react';
import { Search, BookOpen, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APP_PATHS } from '../../../app/route-meta';
import { Incident } from '../../../types';
import { incidentService } from '../api/incident.service';

interface SmartSearchProps {
    query: string;
    systemId?: string;
    onSelectSolution?: (solution: Incident) => void;
}

export const SmartSolutionSearch = ({ query, systemId }: SmartSearchProps) => {
    const [results, setResults] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const search = async () => {
            if (query.length < 3) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const results = await incidentService.searchKnowledgeBase(query, systemId);
                setResults(results);
            } catch (error) {
                console.error('Search failed', error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(search, 500);
        return () => clearTimeout(timeoutId);
    }, [query, systemId]);

    if (!query || query.length < 3) return null;

    return (
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-md p-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-3">
                <Search className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-blue-900">
                    Smart Knowledge Base Suggestions
                </h3>
            </div>

            {loading ? (
                <div className="text-sm text-blue-600 animate-pulse">Searching similar incidents...</div>
            ) : results.length > 0 ? (
                <div className="space-y-3">
                    {results.map((incident) => (
                        <div key={incident.id} className="bg-white p-3 rounded border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] text-slate-400 font-mono">#{incident.id.slice(0, 8)} • {new Date(incident.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-start">
                                <div>
                                    {incident.linkedProcedure ? (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="h-3 w-3 text-purple-500" />
                                                <span className="text-xs font-medium text-purple-700">Suggested Procedure</span>
                                            </div>
                                            <h4 className="text-sm font-medium text-slate-900 mt-1">{incident.linkedProcedure.title}</h4>
                                            <p className="text-xs text-slate-500 mt-1">Found in incident: {incident.title}</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-3 w-3 text-green-500" />
                                                <span className="text-xs font-medium text-slate-500">Resolved Incident</span>
                                            </div>
                                            <h4 className="text-sm font-medium text-slate-900 mt-1">{incident.title}</h4>
                                            <p className="text-xs text-slate-600 mt-1 line-clamp-2">{incident.description}</p>
                                        </>
                                    )}
                                </div>
                                <Link
                                    to={incident.linkedProcedure ? `${APP_PATHS.procedures}/${incident.linkedProcedure.id}` : `${APP_PATHS.incidents}/${incident.id}`}
                                    target="_blank"
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-slate-500 italic">No similar past incidents found.</p>
            )}
        </div>
    );
};


