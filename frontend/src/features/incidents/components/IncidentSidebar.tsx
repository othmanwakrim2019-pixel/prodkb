import { FileText, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SLATimer } from '../../../components/SLATimer';
import { EscalationTimer } from './EscalationTimer';

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
    acknowledgedAt?: string | null;
    resolvedAt?: string | null;
    slaBreached?: boolean;
    sla?: { acknowledgeTimeMinutes: number; resolveTimeMinutes: number; responseTimeHours?: number; resolutionTimeHours?: number } | null;
    assignedTeamId?: string;
    slaId?: string;
    escalationLevel?: number;
    linkedProcedure?: { id: string; title: string };
    severity?: string;
    title?: string;
}

interface Props {
    incident: IncidentData;
    canEdit: boolean;
    canCreateProcedure: boolean;
    onStatusChange: (status: string) => void;
    onUnlinkProcedure: () => void;
}

export const IncidentSidebar = ({ incident, canEdit, canCreateProcedure, onStatusChange, onUnlinkProcedure }: Props): JSX.Element => (
    <div className="space-y-4">
        {/* Status Card */}
        <div className="ent-card p-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Status</h3>
            <select
                value={incident.status}
                onChange={(e) => onStatusChange(e.target.value)}
                disabled={!canEdit}
                className="ent-input w-full disabled:opacity-60"
            >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
            </select>

            <div className="mt-4 space-y-2.5 text-sm divide-y divide-slate-100 dark:divide-slate-800">
                <div className="flex justify-between py-1">
                    <span className="text-slate-500 dark:text-slate-400">Environment</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{incident.environment}</span>
                </div>
                <div className="flex justify-between py-1">
                    <span className="text-slate-500 dark:text-slate-400">System</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{incident.system?.name || 'N/A'}</span>
                </div>
                {incident.job && <div className="flex justify-between py-1">
                    <span className="text-slate-500 dark:text-slate-400">Job</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{incident.job.name}</span>
                </div>}
                <div className="flex justify-between py-1">
                    <span className="text-slate-500 dark:text-slate-400">Created By</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{incident.createdBy?.name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between py-1">
                    <span className="text-slate-500 dark:text-slate-400">Created At</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100 text-xs">{new Date(incident.createdAt).toLocaleString()}</span>
                </div>
                {incident.updatedBy && <div className="flex justify-between py-1">
                    <span className="text-slate-500 dark:text-slate-400">Updated By</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{incident.updatedBy.name}</span>
                </div>}
                {incident.updatedAt && incident.updatedAt !== incident.createdAt && (
                    <div className="flex justify-between py-1">
                        <span className="text-slate-500 dark:text-slate-400">Updated At</span>
                        <span className="font-medium text-slate-900 dark:text-slate-100 text-xs">{new Date(incident.updatedAt).toLocaleString()}</span>
                    </div>
                )}
            </div>
        </div>

        {/* SLA Timer — full variant */}
        {incident.sla && (
            <div className="ent-card p-4">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">SLA</h3>
                <SLATimer
                    createdAt={incident.createdAt}
                    acknowledgedAt={incident.acknowledgedAt}
                    resolvedAt={incident.resolvedAt}
                    status={incident.status}
                    sla={incident.sla}
                    slaBreached={incident.slaBreached}
                    variant="full"
                />
            </div>
        )}

        {/* Escalation Timer */}
        <div className="ent-card p-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Escalation</h3>
            <EscalationTimer incident={incident as Parameters<typeof EscalationTimer>[0]['incident']} />
        </div>

        {/* Procedure Card */}
        <div className="ent-card p-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Resolution Procedure</h3>
            {incident.linkedProcedure ? (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-100 dark:border-blue-800 relative group">
                    <Link to={`/procedures/${incident.linkedProcedure.id}`} className="flex items-start">
                        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-300 hover:underline">{incident.linkedProcedure.title}</p>
                            <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">Click to view procedure</p>
                        </div>
                    </Link>
                    {canEdit && (
                        <button onClick={onUnlinkProcedure} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-slate-800/80 rounded-full" title="Unlink Procedure">
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-2">
                    {canEdit ? (
                        <>
                            <p className="text-sm text-slate-500 dark:text-slate-400">No procedure linked yet.</p>
                            <Link to={`/procedures?linkTo=${incident.id}`} className="block w-full text-center px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
                                Link Existing Procedure
                            </Link>
                        </>
                    ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400">No procedure linked.</p>
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
