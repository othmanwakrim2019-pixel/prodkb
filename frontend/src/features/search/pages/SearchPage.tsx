import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, FileText, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { SearchResults } from '../../../types';
import { useTranslation } from 'react-i18next';
import { APP_PATHS } from '../../../app/route-meta';
import { incidentService } from '../../incidents/api/incident.service';

export const SearchPage = () => {
    const { hasPermission } = useAuth();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults | null>(null);
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();

    if (!hasPermission('SEARCH_VIEW')) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="bg-red-50 p-6 rounded-full mb-4">
                    <ShieldAlert className="h-12 w-12 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{t('common.accessDenied')}</h2>
                <p className="text-slate-600 mt-2 max-w-md">
                    {t('common.accessDeniedMessage')}
                </p>
            </div>
        );
    }

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            const data = await incidentService.search(query);
            setResults(data);
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">{t('search.title')}</h1>

            <form onSubmit={handleSearch} className="max-w-3xl">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent shadow-sm"
                        placeholder={t('search.placeholder')}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="absolute inset-y-0 right-0 px-4 py-2 bg-primary text-white rounded-r-md hover:bg-slate-800 font-medium"
                    >
                        {t('search.button')}
                    </button>
                </div>
            </form>

            {loading && <div className="text-center py-8">{t('search.searching')}</div>}

            {results && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Procedures Results */}
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                            <FileText className="h-5 w-5 mr-2 text-blue-600" />
                            {t('search.procedures')} ({results.procedures.length})
                        </h2>
                        <div className="space-y-4">
                            {results.procedures.map((procedure) => (
                                <Link key={procedure.id} to={`${APP_PATHS.procedures}/${procedure.id}`} className="block group">
                                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:border-accent transition-colors">
                                        <h3 className="font-medium text-slate-900 group-hover:text-accent">{procedure.title}</h3>
                                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{procedure.description}</p>
                                        {procedure.errorCode && (
                                            <span className="inline-block mt-2 font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                                                {procedure.errorCode}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                            {results.procedures.length === 0 && (
                                <p className="text-slate-500 text-sm">{t('search.noProcedures')}</p>
                            )}
                        </div>
                    </div>

                    {/* Incidents Results */}
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                            <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                            {t('search.incidents')} ({results.incidents.length})
                        </h2>
                        <div className="space-y-4">
                            {results.incidents.map((incident) => (
                                <Link key={incident.id} to={`${APP_PATHS.incidents}/${incident.id}`} className="block group">
                                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:border-accent transition-colors">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-medium text-slate-900 group-hover:text-accent">{incident.title}</h3>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${incident.status === 'Resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {incident.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{incident.description}</p>
                                        <p className="text-xs text-slate-400 mt-2">
                                            {new Date(incident.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                            {results.incidents.length === 0 && (
                                <p className="text-slate-500 text-sm">{t('search.noIncidents')}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchPage;
