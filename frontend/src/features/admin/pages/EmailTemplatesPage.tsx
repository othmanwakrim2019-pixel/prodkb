import { useState, useEffect } from 'react';
import { Edit, Save, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import { emailTemplateService, type EmailTemplate } from '../api/admin.service';
import { useToast } from '../../../components/ui/Toast';

export const EmailTemplatesPage = () => {
    const { t } = useTranslation();
    const toast = useToast();
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ subject: string; body: string; enabled: boolean; cc: string }>({
        subject: '', body: '', enabled: true, cc: ''
    });
    const [preview, setPreview] = useState<{ subject: string; body: string } | null>(null);

    useEffect(() => {
        fetchTemplates();
    }, []);


    const fetchTemplates = async () => {
        try {
            const data = await emailTemplateService.getAll();
            setTemplates(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(' Failed to fetch templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (template: EmailTemplate) => {
        setEditingId(template.id);
        setEditForm({
            subject: template.subject,
            body: template.body,
            enabled: template.enabled !== false, // default true
            cc: template.cc || ''
        });
        setPreview(null);
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm({ subject: '', body: '', enabled: true, cc: '' });
        setPreview(null);
    };

    const handleSave = async (id: string) => {
        try {
            await emailTemplateService.update(id, {
                ...editForm,
                cc: editForm.cc.trim() || null,
            });
            setEditingId(null);
            await fetchTemplates();
            setPreview(null);
        } catch (error) {
            console.error('Failed to update template:', error);
            toast.error('Failed to save template');
        }
    };

    const handlePreview = async () => {
        try {
            const data = await emailTemplateService.preview(editForm);
            setPreview(data);
        } catch (error) {
            console.error('Failed to preview template:', error);
        }
    };

    if (loading) return <div>Loading templates...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{t('admin.emailTemplates.title')}</h2>
                    <p className="text-muted-foreground">Customize email notifications sent by the system.</p>
                </div>
            </div>

            <div className="grid gap-6">
                {templates.map(template => (
                    <div key={template.id} className={`bg-white p-6 rounded-lg border shadow-sm ${!template.enabled && editingId !== template.id ? 'opacity-60 bg-slate-50' : ''}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold">{template.name}</h3>
                                    {template.enabled === false && (
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                            Disabled
                                        </span>
                                    )}
                                </div>
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
                                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-md border border-slate-200">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`enabled-${template.id}`}
                                            checked={editForm.enabled}
                                            onChange={e => setEditForm(prev => ({ ...prev, enabled: e.target.checked }))}
                                            className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                                        />
                                        <label htmlFor={`enabled-${template.id}`} className="ml-2 block text-sm font-medium text-slate-900">
                                            Enable this notification
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Subject</label>
                                    <input
                                        value={editForm.subject}
                                        onChange={e => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
                                        className="w-full p-2 border rounded-md"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">CC Recipients (comma separated)</label>
                                    <input
                                        value={editForm.cc}
                                        onChange={e => setEditForm(prev => ({ ...prev, cc: e.target.value }))}
                                        className="w-full p-2 border rounded-md"
                                        placeholder="manager@example.com, audit@example.com"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">These addresses will receive a copy of every email of this type.</p>
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
                                            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(preview.body) }} className="prose max-w-none" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="opacity-75">
                                <div className="mb-2 font-medium text-sm">Subject: {template.subject}</div>
                                {template.cc && (
                                    <div className="mb-2 text-xs text-slate-600">
                                        <span className="font-semibold">CC:</span> {template.cc}
                                    </div>
                                )}
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

export default EmailTemplatesPage;

