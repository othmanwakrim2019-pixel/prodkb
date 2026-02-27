import { useEffect, useState } from 'react';
import axios from '../utils/axios';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { IncidentFilters } from '../components/IncidentFilters';
import { Incident } from '../types';
import { useTranslation } from 'react-i18next';
import { Pagination } from '../components/ui/Pagination';
import { exportToCSV } from '../utils/exportCSV';

export const Incidents = () => {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
    const { canCreate, canDelete } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const { t } = useTranslation();

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete incident "${title}"?`)) {
            return;
        }

        try {
            await axios.delete(`/api/v1/incidents/${id}`);
            setIncidents(incidents.filter(inc => inc.id !== id));
        } catch (error) {
            console.error('Failed to delete incident', error);
            alert('Failed to delete incident');
        }
    };

    useEffect(() => {
        const fetchIncidents = async () => {
            setLoading(true);
            try {
                // Ensure page and limit are set
                const currentParams = new URLSearchParams(searchParams);
                if (!currentParams.get('page')) currentParams.set('page', '1');
                if (!currentParams.get('limit')) currentParams.set('limit', '20');

                const response = await axios.get(`/api/v1/incidents?${currentParams.toString()}`);

                // Axios interceptor already unwraps { success, data } → data
                // So response.data is already { items: [...], meta: {...} }
                const payload = response.data;
                const incidentData = payload?.items || (Array.isArray(payload) ? payload : []);
                const metaData = payload?.meta || { total: incidentData.length, page: 1, limit: 20, totalPages: 1 };

                setIncidents(incidentData);
                setMeta(metaData);
            } catch (error) {
                console.error('Failed to fetch incidents', error);
                setIncidents([]); // Fallback to empty
            } finally {
                setLoading(false);
            }
        };

        fetchIncidents();
    }, [searchParams]);

    const handlePageChange = (newPage: number) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('page', String(newPage));
        setSearchParams(newParams);
    };

    const handleLimitChange = (newLimit: number) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('limit', String(newLimit));
        newParams.set('page', '1'); // Reset to page 1 on limit change
        setSearchParams(newParams);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('incidents.title')}</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => exportToCSV(incidents as any[], 'incidents', [
                            { key: 'title', label: 'Title' },
                            { key: 'severity', label: 'Severity' },
                            { key: 'status', label: 'Status' },
                            { key: 'environment', label: 'Environment' },
                            { key: 'createdAt', label: 'Created At' },
                        ])}
                        className="inline-flex items-center px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                        <Download className="-ml-0.5 mr-1.5 h-4 w-4" />
                        Export CSV
                    </button>
                    {canCreate() && (
                        <Link
                            to="/incidents/new"
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
                        >
                            <Plus className="-ml-1 mr-2 h-5 w-5" />
                            New Incident
                        </Link>
                    )}
                </div>
            </div>

            {/* Filters */}
            <IncidentFilters />

            {/* Incident List */}
            <div className="bg-white shadow-sm rounded-lg border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Title
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    System / Job
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Team
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Created At
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Severity
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {incidents.map((incident) => (
                                <tr key={incident.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <Link to={`/incidents/${incident.id}`} className="text-sm font-medium text-primary hover:text-accent block max-w-xs truncate" title={incident.title}>
                                            {incident.title}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-slate-900">{incident.system?.name || '-'}</div>
                                        <div className="text-xs text-slate-500">{incident.job?.name || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                        {incident.assignedTeam?.name || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {new Date(incident.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${incident.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                                            incident.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                                                incident.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-green-100 text-green-800'
                                            }`}>
                                            {incident.severity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${incident.status === 'Open' ? 'bg-red-100 text-red-800' :
                                            incident.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                            {incident.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {canDelete() && (
                                            <button
                                                onClick={() => handleDelete(incident.id, incident.title)}
                                                className="text-red-600 hover:text-red-900"
                                                title="Delete incident"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {incidents.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">
                                        No incidents found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <Pagination
                    meta={meta}
                    onPageChange={handlePageChange}
                    onLimitChange={handleLimitChange}
                    limitOptions={[10, 20, 50, 100]}
                />
            </div>
        </div>
    );
};

export default Incidents;

