/**
 * IncidentDetails — decomposed into sub-components
 * Extracted: IncidentLogTimeline, IncidentSidebar
 */
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, Upload, Plus, Edit, MessageSquare, ClipboardList } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useIncident } from '../hooks/useIncident';
import { useToast } from '../../../components/ui/Toast';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import { Modal } from '../../../components/ui/Modal';
import { SeverityBadge } from '../../../components/ui/Badge';
import { PageLoader } from '../../../components/ui/PageLoader';
import { EmptyState } from '../../../components/ui/PageLoader';
import { IncidentLogTimeline } from '../components/IncidentLogTimeline';
import { IncidentSidebar } from '../components/IncidentSidebar';
import { WarRoom } from '../components/WarRoom';
export const IncidentDetailsPage = () => {
    const { id } = useParams();
    const { canEdit, hasPermission, user } = useAuth();
    const incident$ = useIncident(id);
    const toast = useToast();
    const { confirm } = useConfirm();

    // Local UI state only
    const [showEditModal, setShowEditModal] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [showFileUpload, setShowFileUpload] = useState(false);
    const [editForm, setEditForm] = useState<{ title?: string; description?: string; severity?: string; assignedTeamId?: string; slaId?: string }>({});
    const [noteForm, setNoteForm] = useState({ logType: 'investigation', content: '' });
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [activeTab, setActiveTab] = useState<'logs' | 'warroom'>('logs');

    // ── Event Handlers ──
    const handleStatusChange = async (newStatus: string) => {
        const ok = await incident$.updateStatus(newStatus);
        if (ok) toast.success('Status updated');
        else toast.error(incident$.error || 'Failed to update status');
    };

    const handleEditIncident = async () => {
        const ok = await incident$.update(editForm);
        if (ok) {
            setShowEditModal(false);
            toast.success('Incident updated');
        } else {
            toast.error(incident$.error || 'Failed to update incident');
        }
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        const ok = await incident$.addLog(noteForm.logType, noteForm.content);
        if (ok) {
            setShowNoteModal(false);
            setNoteForm({ logType: 'investigation', content: '' });
            toast.success('Note added');
        } else {
            toast.error(incident$.error || 'Failed to add note');
        }
    };

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile) return;
        const ok = await incident$.uploadFile(uploadFile);
        if (ok) {
            setShowFileUpload(false);
            setUploadFile(null);
            toast.success('File uploaded');
        } else {
            toast.error(incident$.error || 'Failed to upload');
        }
    };

    const handleUnlinkProcedure = async () => {
        const yes = await confirm('Unlink Procedure', 'Are you sure you want to unlink this procedure?', 'danger');
        if (!yes) return;
        const ok = await incident$.unlinkProcedure();
        if (ok) toast.success('Procedure unlinked');
        else toast.error(incident$.error || 'Failed to unlink');
    };

    const handleDeleteFile = async (fileName: string): Promise<boolean> => {
        const ok = await incident$.deleteFile(fileName);
        if (ok) toast.success('File deleted');
        else toast.error(incident$.error || 'Failed to delete file');
        return ok;
    };

    // ── Loading / Error / Not Found ──
    if (incident$.loading) return <PageLoader />;
    if (!incident$.incident) return <EmptyState title="Incident not found" description="The incident may have been deleted or you don't have access." />;

    const incident = incident$.incident;

    return (
        <div className="space-y-6">
            {/* Resolved Banner */}
            {(incident.status === 'Resolved' || incident.status === 'Closed') && incident.resolvedBy && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-green-900 mb-2">Incident Resolved</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                <div>
                                    <span className="text-green-700 font-medium">Resolved by:</span>
                                    <span className="ml-2 text-green-900">{incident.resolvedBy.name}</span>
                                </div>
                                <div>
                                    <span className="text-green-700 font-medium">Resolved at:</span>
                                    <span className="ml-2 text-green-900">
                                        {incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleString() : 'N/A'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-green-700 font-medium">Duration:</span>
                                    <span className="ml-2 text-green-900">
                                        {incident.resolvedAt
                                            ? `${Math.round((new Date(incident.resolvedAt).getTime() - new Date(incident.createdAt).getTime()) / 60000)} minutes`
                                            : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}




            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
                        <div className="flex justify-between items-start mb-6">
                            <h1 className="text-2xl font-bold text-slate-900 flex-1">{incident.title}</h1>
                            <div className="flex items-center gap-3">
                                {canEdit() && (
                                    <button
                                        onClick={() => {
                                            setEditForm({
                                                title: incident.title,
                                                description: incident.description,
                                                severity: incident.severity,
                                                assignedTeamId: incident.assignedTeamId || '',
                                                slaId: incident.slaId || ''
                                            });
                                            setShowEditModal(true);
                                        }}
                                        className="text-accent hover:text-blue-900 p-2"
                                        title="Edit incident"
                                    >
                                        <Edit className="h-5 w-5" />
                                    </button>
                                )}
                                <SeverityBadge severity={incident.severity} />
                            </div>
                        </div>

                        <div className="prose max-w-none space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Description</h3>
                                <p className="text-slate-700 whitespace-pre-wrap">{incident.description}</p>
                            </div>
                            {/* Tabs: Logs / Discussion */}
                            <div className="flex border-b border-slate-200 mb-4 gap-1">
                                <button
                                    onClick={() => setActiveTab('logs')}
                                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${activeTab === 'logs'
                                        ? 'border-blue-600 text-blue-700 bg-blue-50'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <ClipboardList className="h-4 w-4" /> Logs & Fichiers
                                </button>
                                <button
                                    onClick={() => setActiveTab('warroom')}
                                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${activeTab === 'warroom'
                                        ? 'border-blue-600 text-blue-700 bg-blue-50'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <MessageSquare className="h-4 w-4" /> Discussion
                                </button>
                            </div>

                            {activeTab === 'logs' && (
                                <>
                                    {canEdit() && (
                                        <div className="flex gap-2 mb-4">
                                            <button onClick={() => setShowNoteModal(true)} className="inline-flex items-center px-3 py-1.5 border border-accent rounded-md shadow-sm text-xs font-medium text-accent hover:bg-blue-50">
                                                <Plus className="h-4 w-4 mr-1" /> Add Note
                                            </button>
                                            <button onClick={() => setShowFileUpload(true)} className="inline-flex items-center px-3 py-1.5 border border-slate-300 rounded-md shadow-sm text-xs font-medium text-slate-700 hover:bg-slate-50">
                                                <Upload className="h-4 w-4 mr-1" /> Upload File
                                            </button>
                                        </div>
                                    )}
                                    <IncidentLogTimeline
                                        logs={incident.logs || []}
                                        incidentId={incident.id}
                                        currentUserId={user?.id}
                                        onDownloadFile={incident$.downloadFile}
                                        onDeleteFile={canEdit() ? handleDeleteFile : undefined}
                                    />
                                </>
                            )}

                            {activeTab === 'warroom' && (
                                <div className="h-96">
                                    <WarRoom incidentId={incident.id} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar — extracted component */}
                <IncidentSidebar
                    incident={incident}
                    canEdit={canEdit()}
                    canCreateProcedure={hasPermission('PROCEDURE_CREATE')}
                    onStatusChange={handleStatusChange}
                    onUnlinkProcedure={handleUnlinkProcedure}
                />
            </div>

            {/* Edit Modal */}
            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Incident" size="lg" footer={
                <>
                    <button onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                    <button onClick={handleEditIncident} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800">Save Changes</button>
                </>
            }>
                <div className="grid gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                        <input type="text" value={editForm.title || ''} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea value={editForm.description || ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={4} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Severity</label>
                        <select value={editForm.severity || ''} onChange={(e) => setEditForm({ ...editForm, severity: e.target.value })} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border">
                            <option value="Critical">Critical</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>
                </div>
            </Modal>

            {/* Add Note Modal */}
            <Modal isOpen={showNoteModal} onClose={() => setShowNoteModal(false)} title="Add Note" footer={
                <>
                    <button onClick={() => setShowNoteModal(false)} className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                    <button onClick={(e) => handleAddNote(e as unknown as React.FormEvent)} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800">Add Note</button>
                </>
            }>
                <div className="grid gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Note Type</label>
                        <select value={noteForm.logType} onChange={(e) => setNoteForm({ ...noteForm, logType: e.target.value })} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border">
                            <option value="investigation">Investigation</option>
                            <option value="resolution">Resolution</option>
                            <option value="analysis">Analysis</option>
                            <option value="communication">Communication</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                        <textarea required value={noteForm.content} onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })} rows={5} placeholder="Describe your investigation, analysis, or next steps..." className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border" />
                    </div>
                </div>
            </Modal>

            {/* File Upload Modal */}
            <Modal isOpen={showFileUpload} onClose={() => { setShowFileUpload(false); setUploadFile(null); }} title="Upload File" size="sm" footer={
                <>
                    <button onClick={() => { setShowFileUpload(false); setUploadFile(null); }} className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                    <button onClick={(e) => handleFileUpload(e as unknown as React.FormEvent)} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800">Upload</button>
                </>
            }>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Select File</label>
                    <input type="file" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-white hover:file:bg-blue-700 cursor-pointer" />
                    {uploadFile && <p className="mt-2 text-xs text-slate-500">Selected: {uploadFile.name} ({Math.round(uploadFile.size / 1024)}KB)</p>}
                </div>
            </Modal>
        </div>
    );
};

export default IncidentDetailsPage;
