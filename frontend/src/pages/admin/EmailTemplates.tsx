import { useState, useEffect } from 'react';
import { api } from '../../lib/api'; // Corrected path to lib/api
import { Edit, Save, Eye } from 'lucide-react';

interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    variables: string;
    updatedAt: string;
}

export const EmailTemplates = () => {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ subject: string; body: string }>({ subject: '', body: '' });
    const [preview, setPreview] = useState<{ subject: string; body: string } | null>(null);

    useEffect(() => {
        fetchTemplates();
    }, []);


    const fetchTemplates = async () => {
        try {
            const res = await api.get('/email-templates');
            setTemplates(res.data);
        } catch (error) {
            console.error('❌ Failed to fetch templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (template: EmailTemplate) => {
        setEditingId(template.id);
        setEditForm({ subject: template.subject, body: template.body });
        setPreview(null);
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm({ subject: '', body: '' });
        setPreview(null);
    };

    const handleSave = async (id: string) => {
        try {
            await api.put(`/email-templates/${id}`, editForm);
            setEditingId(null);
            fetchTemplates();
            setPreview(null);
        } catch (error) {
            console.error('Failed to update template:', error);
            alert('Failed to save template');
        }
    };

    const handlePreview = async () => {
        try {
            const res = await api.post('/email-templates/preview', editForm);
            setPreview(res.data);
        } catch (error) {
            console.error('Failed to preview template:', error);
        }
    };

    if (loading) return <div>Loading templates...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Email Templates</h2>
                    <p className="text-muted-foreground">Customize email notifications sent by the system.</p>
                </div>
            </div>

            <div className="grid gap-6">
                {templates.map(template => (
                    <div key={template.id} className="bg-white p-6 rounded-lg border shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-semibold">{template.name}</h3>
                                <p className="text-sm text-slate-500">Last updated: {new Date(template.updatedAt).toLocaleString()}</p>
                            </div>
                            {editingId !== template.id && (
                                <button
                                    onClick={() => handleEdit(template)}
                                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                                >
                                    <Edit className="w-4 h-4" /> Edit
                                </button>
                            )}
                        </div>

                        {editingId === template.id ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Subject</label>
                                    <input
                                        value={editForm.subject}
                                        onChange={e => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
                                        className="w-full p-2 border rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Body (HTML)</label>
                                    <textarea
                                        value={editForm.body}
                                        onChange={e => setEditForm(prev => ({ ...prev, body: e.target.value }))}
                                        className="w-full p-2 border rounded-md font-mono text-sm h-64"
                                    />
                                </div>

                                {/* Helper Variables - Clickable to insert */}
                                <div className="bg-slate-50 p-3 rounded">
                                    <div className="text-xs font-semibold text-slate-600 mb-2">Available Variables (click to insert):</div>
                                    <div className="flex flex-wrap gap-1">
                                        {(template.variables || '{{incident.id}}, {{incident.title}}, {{incident.severity}}, {{incident.status}}, {{incident.description}}, {{incident.createdBy.name}}, {{incident.assignedTeam.name}}, {{incident.system.name}}, {{appUrl}}')
                                            .split(',')
                                            .map(v => v.trim())
                                            .map((variable, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => setEditForm(prev => ({ ...prev, body: prev.body + ' ' + variable }))}
                                                    className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-mono hover:bg-blue-200 transition-colors"
                                                    title={`Click to insert ${variable}`}
                                                >
                                                    {variable}
                                                </button>
                                            ))
                                        }
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={() => handleSave(template.id)}
                                        className="bg-primary text-white px-4 py-2 rounded-md hover:bg-slate-800 flex items-center gap-2"
                                    >
                                        <Save className="w-4 h-4" /> Save
                                    </button>
                                    <button
                                        onClick={handlePreview}
                                        className="bg-white border text-slate-700 px-4 py-2 rounded-md hover:bg-slate-50 flex items-center gap-2"
                                    >
                                        <Eye className="w-4 h-4" /> Preview
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="text-slate-500 px-4 py-2 hover:text-slate-700"
                                    >
                                        Cancel
                                    </button>
                                </div>

                                {preview && (
                                    <div className="mt-4 border rounded-md overflow-hidden">
                                        <div className="bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b">
                                            Preview
                                        </div>
                                        <div className="p-4 bg-white">
                                            <div className="mb-2 font-bold text-lg border-b pb-2">{preview.subject}</div>
                                            <div dangerouslySetInnerHTML={{ __html: preview.body }} className="prose max-w-none" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="opacity-75">
                                <div className="mb-2 font-medium text-sm">Subject: {template.subject}</div>
                                <div className="text-xs text-slate-500 truncate">{template.body.substring(0, 100)}...</div>
                            </div>
                        )}
                    </div>
                ))}

                {templates.length === 0 && !loading && (
                    <div className="text-center p-8 text-slate-500">
                        No templates found. Run the seed script or create templates in the database.
                    </div>
                )}
            </div>
        </div>
    );
};
