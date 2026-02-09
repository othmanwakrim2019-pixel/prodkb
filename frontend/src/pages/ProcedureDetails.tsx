import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { ArrowLeft, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProcedureDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const [procedure, setProcedure] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this procedure? This action cannot be undone.')) return;
        try {
            await axios.delete(`/api/procedures/${id}`);
            alert('Procedure deleted successfully.');
            navigate('/procedures');
        } catch (error) {
            console.error('Failed to delete procedure', error);
            alert('Failed to delete procedure.');
        }
    };

    useEffect(() => {
        const fetchProcedure = async () => {
            try {
                const response = await axios.get(`/api/procedures/${id}`);
                setProcedure(response.data);
            } catch (error) {
                console.error('Failed to fetch procedure', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchProcedure();
    }, [id]);

    if (loading) return <div>Loading...</div>;
    if (!procedure) return <div>Procedure not found</div>;

    return (
        <div className="space-y-6">
            <Link to="/procedures" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Procedures
            </Link>

            <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">{procedure.title}</h1>
                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                            <span className="font-medium text-slate-700">{procedure.system.name}</span>
                            {procedure.job && <span>• {procedure.job.name} ({procedure.job.code})</span>}
                            {procedure.errorCode && <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">{procedure.errorCode}</span>}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="text-right text-sm text-slate-500">
                            <p>Created by {procedure.createdBy.name}</p>
                            <p>{new Date(procedure.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2 mt-2">
                            {hasPermission('PROCEDURE_EDIT') && (
                                <Link
                                    to={`/procedures/${id}/edit`}
                                    className="inline-flex items-center px-3 py-1.5 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
                                >
                                    Edit
                                </Link>
                            )}
                            {hasPermission('PROCEDURE_DELETE') && (
                                <button
                                    onClick={handleDelete}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="prose max-w-none space-y-8">
                    <section>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Description</h3>
                        <p className="text-slate-700 whitespace-pre-wrap">{procedure.description}</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Root Cause</h3>
                        <p className="text-slate-700 whitespace-pre-wrap">{procedure.rootCause || 'Not specified'}</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Resolution Steps</h3>
                        <div className="bg-slate-50 p-4 rounded-md border border-slate-200 font-mono text-sm whitespace-pre-wrap">
                            {procedure.resolutionSteps}
                        </div>
                    </section>

                    {procedure.workaround && (
                        <section>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Workaround</h3>
                            <p className="text-slate-700 whitespace-pre-wrap">{procedure.workaround}</p>
                        </section>
                    )}

                    {procedure.commands && (
                        <section>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Commands / Scripts</h3>
                            <pre className="bg-slate-900 text-slate-50 p-4 rounded-md overflow-x-auto text-sm">
                                <code>{procedure.commands}</code>
                            </pre>
                        </section>
                    )}

                    {procedure.tags && (
                        <div className="flex items-center space-x-2 pt-4 border-t border-slate-200">
                            <Tag className="h-4 w-4 text-slate-400" />
                            {procedure.tags.split(',').map((tag: string) => (
                                <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {tag.trim()}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Linked Incidents */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Linked Incidents ({procedure.incidents.length})</h2>
                <div className="space-y-4">
                    {procedure.incidents.map((incident: any) => (
                        <div key={incident.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-md border border-slate-200">
                            <div>
                                <Link to={`/incidents/${incident.id}`} className="font-medium text-primary hover:text-accent">
                                    {incident.title}
                                </Link>
                                <p className="text-xs text-slate-500">{new Date(incident.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${incident.status === 'Resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {incident.status}
                            </span>
                        </div>
                    ))}
                    {procedure.incidents.length === 0 && (
                        <p className="text-slate-500 text-sm">No incidents linked to this procedure yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
