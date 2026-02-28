import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from '../utils/axios';
import { Plus, Search as SearchIcon, Link as LinkIcon, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Procedure } from '../types';
import { useTranslation } from 'react-i18next';
import { Pagination } from '../components/ui/Pagination';

export const Procedures = () => {
    const { hasPermission } = useAuth();
    const { t } = useTranslation();
    const [procedures, setProcedures] = useState<Procedure[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [searchParams] = useSearchParams();
    const linkToIncidentId = searchParams.get('linkTo');
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 12;

    useEffect(() => {
        const fetchProcedures = async () => {
            try {
                const response = await axios.get('/api/v1/procedures', { params: { search } });
                setProcedures(Array.isArray(response.data) ? response.data : response.data?.data || []);
            } catch (error) {
                console.error('Failed to fetch procedures', error);
            } finally {
                setLoading(false);
            }
        };

        if (hasPermission('PROCEDURE_VIEW')) {
            const timeoutId = setTimeout(() => {
                fetchProcedures();
            }, 300); // Debounce
            return () => clearTimeout(timeoutId);
        } else {
            setLoading(false);
        }
    }, [search, hasPermission]);

    const handleLinkProcedure = async (procedureId: string) => {
        if (!linkToIncidentId) return;

        try {
            await axios.post(`/api/v1/incidents/${linkToIncidentId}/link-procedure/${procedureId}`);
            alert('Procedure linked successfully!');
            window.location.href = `/incidents/${linkToIncidentId}`;
        } catch (error) {
            console.error('Failed to link procedure', error);
            alert('Failed to link procedure');
        }
    };

    if (!hasPermission('PROCEDURE_VIEW')) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="bg-red-50 p-6 rounded-full mb-4">
                    <ShieldAlert className="h-12 w-12 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{t('common.accessDenied')}</h2>
                <p className="text-slate-600 mt-2 max-w-md">
                    You do not have permission to view procedures. Please contact your administrator if you believe this is an error.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {linkToIncidentId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <LinkIcon className="h-5 w-5 text-blue-600 mr-2" />
                        <p className="text-sm text-blue-900">
                            <strong>Linking Mode:</strong> Click on a procedure below to link it to the incident
                        </p>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">{t('procedures.title')}</h1>
                {hasPermission('PROCEDURE_CREATE') && !linkToIncidentId && (
                    <Link
                        to="/procedures/new"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
                    >
                        <Plus className="-ml-1 mr-2 h-5 w-5" />
                        New Procedure
                    </Link>
                )}
            </div>

            {/* Search Bar */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-accent focus:border-accent sm:text-sm"
                    placeholder="Search procedures by title, error code, tags..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Procedure List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {procedures.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE).map((procedure) => (
                    <div key={procedure.id} className="block group">
                        {linkToIncidentId ? (
                            <button
                                onClick={() => handleLinkProcedure(procedure.id)}
                                className="w-full text-left bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-full hover:border-accent hover:shadow-md transition-all"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-medium text-slate-900 group-hover:text-accent line-clamp-2">
                                        {procedure.title}
                                    </h3>
                                    <LinkIcon className="h-5 w-5 text-blue-600 flex-shrink-0 ml-2" />
                                </div>

                                <div className="space-y-2 text-sm text-slate-500">
                                    <div className="flex justify-between">
                                        <span>System:</span>
                                        <span className="font-medium text-slate-700">{procedure.system.name}</span>
                                    </div>
                                    {procedure.errorCode && (
                                        <div className="flex justify-between">
                                            <span>Error Code:</span>
                                            <span className="font-mono bg-slate-100 px-1 rounded">{procedure.errorCode}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span>Used in:</span>
                                        <span className="font-medium text-slate-700">{procedure._count?.incidents || 0} incidents</span>
                                    </div>
                                </div>

                                {procedure.tags && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {procedure.tags.split(',').map((tag: string) => (
                                            <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                                                {tag.trim()}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </button>
                        ) : (
                            <Link to={`/procedures/${procedure.id}`} className="block">
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-full hover:border-accent transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-medium text-slate-900 group-hover:text-accent line-clamp-2">
                                            {procedure.title}
                                        </h3>
                                    </div>

                                    <div className="space-y-2 text-sm text-slate-500">
                                        <div className="flex justify-between">
                                            <span>System:</span>
                                            <span className="font-medium text-slate-700">{procedure.system.name}</span>
                                        </div>
                                        {procedure.errorCode && (
                                            <div className="flex justify-between">
                                                <span>Error Code:</span>
                                                <span className="font-mono bg-slate-100 px-1 rounded">{procedure.errorCode}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span>Used in:</span>
                                            <span className="font-medium text-slate-700">{procedure._count?.incidents || 0} incidents</span>
                                        </div>
                                    </div>

                                    {procedure.tags && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {procedure.tags.split(',').map((tag: string) => (
                                                <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                                                    {tag.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        )}
                    </div>
                ))}
                {procedures.length === 0 && !loading && (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        No procedures found matching your search.
                    </div>
                )}
            </div>

            {/* Pagination */}
            {procedures.length > ITEMS_PER_PAGE && (
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <Pagination
                        meta={{
                            total: procedures.length,
                            page,
                            limit: ITEMS_PER_PAGE,
                            totalPages: Math.ceil(procedures.length / ITEMS_PER_PAGE),
                        }}
                        onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    />
                </div>
            )}
        </div>
    );
};

export default Procedures;

