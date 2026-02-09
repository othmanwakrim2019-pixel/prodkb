import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../utils/axios';
import { FileText, CheckCircle, Upload, Plus, Edit, Paperclip, Download, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Incident, Log } from '../types';

export const IncidentDetails = () => {
    const { id } = useParams();
    const { canEdit, hasPermission } = useAuth();
    const [incident, setIncident] = useState<Incident | null>(null);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [showFileUpload, setShowFileUpload] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editForm, setEditForm] = useState<any>({});
    const [noteForm, setNoteForm] = useState({ logType: 'investigation', content: '' });
    const [uploadFile, setUploadFile] = useState<File | null>(null);

    const fetchIncident = useCallback(async () => {
        try {
            const response = await axios.get(`/api/incidents/${id}`);
            setIncident(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch incident', error);
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchIncident();
    }, [fetchIncident]);

    const handleStatusChange = async (newStatus: string) => {
        try {
            await axios.put(`/api/incidents/${id}/status`, { status: newStatus });
            fetchIncident(); // Refresh to get updated resolvedBy and endDatetime
        } catch (error) {
            console.error('Failed to update status', error);
            alert('Failed to update status');
        }
    };

    const handleEditIncident = async () => {
        try {
            await axios.put(`/api/incidents/${id}`, editForm);
            setShowEditModal(false);
            fetchIncident();
            alert('Incident updated successfully!');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error('Failed to update incident', error);
            // safe check for response
            alert(error.response?.data?.error || 'Failed to update incident');
        }
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(`/api/incidents/${id}/logs`, {
                logType: noteForm.logType,
                rawLog: noteForm.content
            });
            setShowNoteModal(false);
            setNoteForm({ logType: 'investigation', content: '' });
            fetchIncident();
            alert('Note added successfully!');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error('Failed to add note', error);
            // safe check for response
            alert(error.response?.data?.error || 'Failed to add note');
        }
    };

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile) return;

        const formData = new FormData();
        formData.append('file', uploadFile);

        try {
            await axios.post(`/api/incidents/${id}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowFileUpload(false);
            setUploadFile(null);
            fetchIncident();
            alert('File uploaded successfully!');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error('Failed to upload file', error);
            // safe check for response
            alert(error.response?.data?.error || 'Failed to upload file');
        }
    };

    const handleUnlinkProcedure = async () => {
        if (!confirm('Are you sure you want to unlink this procedure?')) return;
        try {
            await axios.put(`/api/incidents/${id}`, { linkedProcedureId: null });
            fetchIncident();
            alert('Procedure unlinked successfully!');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error('Failed to unlink procedure', error);
            // safe check for response
            alert(error.response?.data?.error || 'Failed to unlink procedure');
        }
    };

    const handleDownloadFile = async (fileName: string) => {
        try {
            const response = await axios.get(`/api/incidents/${id}/files/${fileName}`, {
                responseType: 'blob',
            });

            // Create a blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);

            // Append to html link element page
            document.body.appendChild(link);

            // Start download
            link.click();

            // Clean up and remove the link
            link.parentNode?.removeChild(link);
        } catch (error) {
            console.error('Failed to download file', error);
            alert('Failed to download file');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!incident) return <div>Incident not found</div>;

    return (
        <div className="space-y-6">
            {/* ... existing code ... */}

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
                                        {incident.endDatetime ? new Date(incident.endDatetime).toLocaleString() : 'N/A'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-green-700 font-medium">Duration:</span>
                                    <span className="ml-2 text-green-900">
                                        {incident.endDatetime
                                            ? `${Math.round((new Date(incident.endDatetime).getTime() - new Date(incident.startDatetime).getTime()) / 60000)} minutes`
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
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${incident.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                                    incident.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                                        incident.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-blue-100 text-blue-800'
                                    }`}>
                                    {incident.severity}
                                </span>
                            </div>
                        </div>

                        <div className="prose max-w-none space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Description</h3>
                                <p className="text-slate-700 whitespace-pre-wrap">{incident.description}</p>
                            </div>

                            {/* Notes & Files Section */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Logs, Notes & Files</h3>
                                    {canEdit() && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setShowNoteModal(true)}
                                                className="inline-flex items-center px-3 py-1.5 border border-accent rounded-md shadow-sm text-xs font-medium text-accent hover:bg-blue-50"
                                            >
                                                <Plus className="h-4 w-4 mr-1" />
                                                Add Note
                                            </button>
                                            <button
                                                onClick={() => setShowFileUpload(true)}
                                                className="inline-flex items-center px-3 py-1.5 border border-slate-300 rounded-md shadow-sm text-xs font-medium text-slate-700 hover:bg-slate-50"
                                            >
                                                <Upload className="h-4 w-4 mr-1" />
                                                Upload File
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {incident.logs && incident.logs.length > 0 ? (
                                    <div className="space-y-3">
                                        {incident.logs.map((log: Log) => (
                                            <div key={log.id} className="bg-slate-50 p-4 rounded-md border border-slate-200">
                                                <div className="flex items-start justify-between mb-2">
                                                    <span className="text-xs font-medium text-slate-500 uppercase">{log.logType}</span>
                                                    <span className="text-xs text-slate-400">
                                                        {new Date(log.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                {log.fileName && (
                                                    <div className="flex items-center text-sm text-accent mb-2">
                                                        <Paperclip className="h-4 w-4 mr-2" />
                                                        <button
                                                            onClick={() => handleDownloadFile(log.fileName!)}
                                                            className="hover:underline text-left"
                                                        >
                                                            {log.fileName} ({Math.round((log.fileSize || 0) / 1024)}KB)
                                                        </button>
                                                        <Download className="h-3 w-3 ml-2" />
                                                    </div>
                                                )}
                                                {log.errorMessage && <p className="text-red-600 font-medium text-sm mb-2">{log.errorMessage}</p>}
                                                {log.rawLog && (
                                                    <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap overflow-x-auto">
                                                        {log.rawLog}
                                                    </pre>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 text-center py-4">No logs or files yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Status Card */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Status</h3>
                        <select
                            value={incident.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            disabled={!canEdit()}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border disabled:bg-slate-100 disabled:text-slate-500"
                        >
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                        </select>

                        <div className="mt-6 space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Environment</span>
                                <span className="font-medium text-slate-900">{incident.environment}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">System</span>
                                <span className="font-medium text-slate-900">{incident.system?.name || 'N/A'}</span>
                            </div>
                            {incident.job && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Job</span>
                                    <span className="font-medium text-slate-900">{incident.job.name}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-slate-500">Created By</span>
                                <span className="font-medium text-slate-900">{incident.createdBy?.name || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Created At</span>
                                <span className="font-medium text-slate-900">
                                    {new Date(incident.createdAt).toLocaleString()}
                                </span>
                            </div>
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
                                {canEdit() && (
                                    <button
                                        onClick={handleUnlinkProcedure}
                                        className="absolute top-2 right-2 text-slate-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/50 rounded-full"
                                        title="Unlink Procedure"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {canEdit() ? (
                                    <>
                                        <p className="text-sm text-slate-500">No procedure linked yet.</p>
                                        <Link
                                            to={`/procedures?linkTo=${incident.id}`}
                                            className="block w-full text-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
                                        >
                                            Link Existing Procedure
                                        </Link>
                                    </>
                                ) : (
                                    <p className="text-sm text-slate-500 max-w-xs">No procedure linked.</p>
                                )}

                                {hasPermission('PROCEDURE_CREATE') && (
                                    <Link
                                        to={`/procedures/new?fromIncident=${incident.id}`}
                                        className="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800"
                                    >
                                        Draft Procedure from Incident
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Incident Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-3xl w-full m-4 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Edit Incident</h3>
                        <div className="grid gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    rows={4}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Severity</label>
                                <select
                                    value={editForm.severity}
                                    onChange={(e) => setEditForm({ ...editForm, severity: e.target.value })}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                >
                                    <option value="Critical">Critical</option>
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditIncident}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Note Modal */}
            {showNoteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full m-4">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Note</h3>
                        <form onSubmit={handleAddNote}>
                            <div className="grid gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Note Type</label>
                                    <select
                                        value={noteForm.logType}
                                        onChange={(e) => setNoteForm({ ...noteForm, logType: e.target.value })}
                                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                    >
                                        <option value="investigation">Investigation</option>
                                        <option value="resolution">Resolution</option>
                                        <option value="analysis">Analysis</option>
                                        <option value="communication">Communication</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                                    <textarea
                                        required
                                        value={noteForm.content}
                                        onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                                        rows={5}
                                        placeholder="Describe your investigation, analysis, or next steps..."
                                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowNoteModal(false)}
                                    className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800"
                                >
                                    Add Note
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* File Upload Modal */}
            {showFileUpload && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full m-4">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Upload File</h3>
                        <form onSubmit={handleFileUpload}>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Select File</label>
                                <input
                                    type="file"
                                    required
                                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                    className="block w-full text-sm text-slate-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-md file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-accent file:text-white
                                        hover:file:bg-blue-700
                                        cursor-pointer"
                                />
                                {uploadFile && (
                                    <p className="mt-2 text-xs text-slate-500">
                                        Selected: {uploadFile.name} ({Math.round(uploadFile.size / 1024)}KB)
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowFileUpload(false);
                                        setUploadFile(null);
                                    }}
                                    className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800"
                                >
                                    Upload
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
