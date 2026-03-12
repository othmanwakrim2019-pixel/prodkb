import { FileText, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface IncidentData {
    id: string;
    status: string;
    environment: string;
    system?: { name: string };
    job?: { name: string };
    createdBy?: { name: string };
    createdAt: string;
    updatedBy?: { name: string };
    updatedAt?: string;
    assignedTeamId?: string;
    slaId?: string;
    linkedProcedure?: { id: string; title: string };
}

interface Props {
    incident: IncidentData;
    canEdit: boolean;
    canCreateProcedure: boolean;
    onStatusChange: (status: string) => void;
    onUnlinkProcedure: () => void;
}

export const IncidentSidebar = ({ incident, canEdit, canCreateProcedure, onStatusChange, onUnlinkProcedure }: Props): JSX.Element => (
    <div className="space-y-6">
        {/* Status Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Status</h3>
            <select
                value={incident.status}
                onChange={(e) => onStatusChange(e.target.value)}
                disabled={!canEdit}
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border disabled:bg-slate-100 disabled:text-slate-500"
            >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
            </select>

            <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Environment</span><span className="font-medium text-slate-900">{incident.environment}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">System</span><span className="font-medium text-slate-900">{incident.system?.name || 'N/A'}</span></div>
                {incident.job && <div className="flex justify-between"><span className="text-slate-500">Job</span><span className="font-medium text-slate-900">{incident.job.name}</span></div>}
                <div className="flex justify-between"><span className="text-slate-500">Created By</span><span className="font-medium text-slate-900">{incident.createdBy?.name || 'Unknown'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Created At</span><span className="font-medium text-slate-900">{new Date(incident.createdAt).toLocaleString()}</span></div>
                {incident.updatedBy && <div className="flex justify-between"><span className="text-slate-500">Updated By</span><span className="font-medium text-slate-900">{incident.updatedBy.name}</span></div>}
                {incident.updatedAt && incident.updatedAt !== incident.createdAt && (
                    <div className="flex justify-between"><span className="text-slate-500">Updated At</span><span className="font-medium text-slate-900">{new Date(incident.updatedAt).toLocaleString()}</span></div>
                )}
            </div>
        </div>

        {/* Procedure Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Resolution Procedure</h3>
            {incident.linkedProcedure ? (
                <div className="bg-blue-50 p-4 rounded-md border border-blue-100 relative group">
                    <Link to={`/procedures/${incident.linkedProcedure.id}`} className="flex items-start">
                        <FileText className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-blue-900 hover:underline">{incident.linkedProcedure.title}</p>
                            <p className="text-xs text-blue-700 mt-1">Click to view procedure</p>
                        </div>
                    </Link>
                    {canEdit && (
                        <button onClick={onUnlinkProcedure} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/50 rounded-full" title="Unlink Procedure">
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {canEdit ? (
                        <>
                            <p className="text-sm text-slate-500">No procedure linked yet.</p>
                            <Link to={`/procedures?linkTo=${incident.id}`} className="block w-full text-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">
                                Link Existing Procedure
                            </Link>
                        </>
                    ) : (
                        <p className="text-sm text-slate-500 max-w-xs">No procedure linked.</p>
                    )}
                    {canCreateProcedure && (
                        <Link to={`/procedures/new?fromIncident=${incident.id}`} className="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800">
                            Draft Procedure from Incident
                        </Link>
                    )}
                </div>
            )}
        </div>
    </div>
);
