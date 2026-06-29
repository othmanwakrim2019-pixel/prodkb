import { useState, useEffect } from 'react';
import { Edit, Save, Eye, Plus, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import { emailTemplateService, type EmailTemplate, type EmailTemplateInput } from '../api/admin.service';
import { useToast } from '../../../components/ui/Toast';

const DEFAULT_VARIABLES = '{{incident.id}}, {{incident.title}}, {{incident.severity}}, {{incident.status}}, {{incident.description}}, {{incident.createdBy.name}}, {{incident.assignedTeam.name}}, {{incident.system.name}}, {{incident.job.code}}, {{incident.job.name}}, {{incident.sla.name}}, {{appUrl}}';

const emptyForm: EmailTemplateInput = {
    name: '',
    subject: '',
    body: '',
    variables: DEFAULT_VARIABLES,
    enabled: true,
    cc: null,
};

export const EmailTemplatesPage = () => {
    const { t } = useTranslation();
    const toast = useToast();
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [form, setForm] = useState<EmailTemplateInput>(emptyForm);
    const [preview, setPreview] = useState<{ subject: string; body: string } | null>(null);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const data = await emailTemplateService.getAll();
            setTemplates(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch templates:', error);
            toast.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const beginCreate = () => {
        setIsCreating(true);
        setEditingId(null);
        setForm(emptyForm);
        setPreview(null);
    };

    const beginEdit = (template: EmailTemplate) => {
        setEditingId(template.id);
        setIsCreating(false);
        setForm({
            name: template.name,
            subject: template.subject,
            body: template.body,
            variables: template.variables || DEFAULT_VARIABLES,
            enabled: template.enabled !== false,
            cc: template.cc || null,
        });
        setPreview(null);
    };

    const cancel = () => {
        setEditingId(null);
        setIsCreating(false);
        setForm(emptyForm);
        setPreview(null);
    };

    const normalizeForm = (): EmailTemplateInput => ({
        ...form,
        name: form.name.trim(),
        subject: form.subject.trim(),
        variables: form.variables?.trim() || null,
        cc: form.cc?.trim() || null,
    });

    const save = async () => {
        const payload = normalizeForm();
        if (!payload.name || !payload.subject || !payload.body) {
            toast.error('Name, subject, and body are required');
            return;
        }

        try {
            if (isCreating) {
                await emailTemplateService.create(payload);
                toast.success('Template created');
            } else if (editingId) {
                await emailTemplateService.update(editingId, payload);
                toast.success('Template saved');
            }
            cancel();
            await fetchTemplates();
        } catch (error) {
            console.error('Failed to save template:', error);
            toast.error('Failed to save template');
        }
    };

    const deleteTemplate = async (template: EmailTemplate) => {
        if (!window.confirm(`Delete template "${template.name}"?`)) return;

        try {
            await emailTemplateService.delete(template.id);
            toast.success('Template deleted');
            await fetchTemplates();
        } catch (error) {
            console.error('Failed to delete template:', error);
            toast.error('Failed to delete template');
        }
    };

    const handlePreview = async () => {
        try {
            const data = await emailTemplateService.preview({
                subject: form.subject,
                body: form.body,
                enabled: form.enabled,
                cc: form.cc || '',
            });
            setPreview(data);
        } catch (error) {
            console.error('Failed to preview template:', error);
            toast.error('Failed to preview template');
        }
    };

    const insertVariable = (variable: string) => {
        setForm(prev => ({ ...prev, body: `${prev.body}${prev.body.endsWith(' ') || !prev.body ? '' : ' '}${variable}` }));
    };

    const renderEditor = () => (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {isCreating ? 'Create Email Template' : `Edit ${form.name}`}
                    </h3>
                    <p className="text-sm text-slate-500">Use variables like {'{{incident.title}}'} in the subject or body.</p>
                </div>
                <button onClick={cancel} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700" title="Close editor">
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Template Name</label>
                    <input
                        value={form.name}
                        onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700"
                        placeholder="incident_created"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">CC Recipients</label>
                    <input
                        value={form.cc || ''}
                        onChange={e => setForm(prev => ({ ...prev, cc: e.target.value }))}
                        className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700"
                        placeholder="manager@example.com, audit@example.com"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md">
                <input
                    type="checkbox"
                    checked={form.enabled}
                    onChange={e => setForm(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                />
                <span className="text-sm font-medium">Enable this notification</span>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <input
                    value={form.subject}
                    onChange={e => setForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Body HTML</label>
                <textarea
                    value={form.body}
                    onChange={e => setForm(prev => ({ ...prev, body: e.target.value }))}
                    className="w-full p-2 border rounded-md font-mono text-sm h-72 dark:bg-slate-900 dark:border-slate-700"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Available Variables</label>
                <textarea
                    value={form.variables || ''}
                    onChange={e => setForm(prev => ({ ...prev, variables: e.target.value }))}
                    className="w-full p-2 border rounded-md font-mono text-xs h-20 dark:bg-slate-900 dark:border-slate-700"
                    placeholder="{{incident.title}}, {{appUrl}}"
                />
                <div className="flex flex-wrap gap-1 mt-2">
                    {(form.variables || DEFAULT_VARIABLES).split(',').map(v => v.trim()).filter(Boolean).map(variable => (
                        <button
                            key={variable}
                            type="button"
                            onClick={() => insertVariable(variable)}
                            className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-mono hover:bg-blue-200"
                        >
                            {variable}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
                <button onClick={save} className="bg-primary text-white px-4 py-2 rounded-md hover:bg-slate-800 flex items-center gap-2">
                    <Save className="w-4 h-4" /> Save
                </button>
                <button onClick={handlePreview} className="bg-white border text-slate-700 px-4 py-2 rounded-md hover:bg-slate-50 flex items-center gap-2">
                    <Eye className="w-4 h-4" /> Preview
                </button>
            </div>

            {preview && (
                <div className="mt-4 border rounded-md overflow-hidden">
                    <div className="bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b">Preview</div>
                    <div className="p-4 bg-white">
                        <div className="mb-2 font-bold text-lg border-b pb-2">{preview.subject}</div>
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(preview.body) }} className="prose max-w-none" />
                    </div>
                </div>
            )}
        </div>
    );

    if (loading) return <div>Loading templates...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{t('admin.emailTemplates.title')}</h2>
                    <p className="text-muted-foreground">Create and customize email notifications sent by the system.</p>
                </div>
                <button onClick={beginCreate} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                    <Plus className="h-4 w-4" /> New Template
                </button>
            </div>

            {(isCreating || editingId) && renderEditor()}

            <div className="grid gap-4">
                {templates.map(template => (
                    <div key={template.id} className={`bg-white dark:bg-slate-800 p-5 rounded-lg border shadow-sm ${!template.enabled ? 'opacity-70' : ''}`}>
                        <div className="flex justify-between items-start gap-4">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold truncate">{template.name}</h3>
                                    {template.enabled === false && <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Disabled</span>}
                                </div>
                                <p className="text-sm text-slate-500">Last updated: {new Date(template.updatedAt).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button onClick={() => beginEdit(template)} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                                    <Edit className="w-4 h-4" /> Edit
                                </button>
                                <button onClick={() => deleteTemplate(template)} className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800">
                                    <Trash2 className="w-4 h-4" /> Delete
                                </button>
                            </div>
                        </div>
                        <div className="mt-3 text-sm">
                            <div className="font-medium text-slate-700 dark:text-slate-200">Subject: {template.subject}</div>
                            {template.cc && <div className="text-xs text-slate-600 mt-1"><span className="font-semibold">CC:</span> {template.cc}</div>}
                            <div className="text-xs text-slate-500 mt-2 truncate">{template.body.substring(0, 140)}...</div>
                        </div>
                    </div>
                ))}

                {templates.length === 0 && (
                    <div className="text-center p-8 text-slate-500 border rounded-lg">
                        No templates found. Create one to enable custom notifications.
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailTemplatesPage;
