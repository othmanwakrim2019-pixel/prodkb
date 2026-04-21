import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FileDown } from 'lucide-react';
import { incidentService } from '../api/incident.service';
import type { PostMortem } from '../model/incident.types';

interface Props {
    incidentId: string;
    incidentTitle?: string;
    canEdit: boolean;
}

export const PostMortemTab = ({ incidentId, incidentTitle, canEdit }: Props) => {
    const { t } = useTranslation();
    const [pm, setPm] = useState<PostMortem | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        summary: '',
        rootCause: '',
        timeline: '',
        impact: '',
        lessonsLearned: '',
        preventiveActions: '',
        status: 'DRAFT',
    });

    const fetchPM = useCallback(async () => {
        try {
            const data = await incidentService.getPostMortem(incidentId);
            if (data) {
                setPm(data);
                setForm({
                    summary: data.summary || '',
                    rootCause: data.rootCause || '',
                    timeline: data.timeline || '',
                    impact: data.impact || '',
                    lessonsLearned: data.lessonsLearned || '',
                    preventiveActions: data.preventiveActions || '',
                    status: data.status || 'DRAFT',
                });
            }
        } catch {
            // No post-mortem yet
        } finally {
            setLoading(false);
        }
    }, [incidentId]);

    useEffect(() => { fetchPM(); }, [fetchPM]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const data = await incidentService.savePostMortem(incidentId, form);
            setPm(data);
            setEditing(false);
        } catch (err) {
            console.error('Failed to save post-mortem', err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <p className="text-sm text-slate-400 py-4 text-center">{t('common.loading')}</p>;

    const exportPDF = () => {
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow || !pm) return;
        const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Post-Mortem — ${incidentTitle || incidentId}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1e293b; margin: 40px; line-height: 1.6; }
  h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
  .meta { font-size: 11px; color: #64748b; margin-bottom: 24px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; background: ${pm.status === 'PUBLISHED' ? '#d1fae5' : '#fef3c7'}; color: ${pm.status === 'PUBLISHED' ? '#065f46' : '#92400e'}; margin-right: 8px; }
  section { margin-bottom: 20px; page-break-inside: avoid; }
  h2 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  p { margin: 0; white-space: pre-wrap; color: #334155; }
  @media print { body { margin: 20px; } }
</style>
</head>
<body>
<h1>Post-Mortem Report</h1>
<div class="meta">
  <span class="badge">${pm.status}</span>
  Incident: <strong>${incidentTitle || incidentId}</strong>
  ${pm.createdBy ? `&nbsp;&bull;&nbsp; Author: ${pm.createdBy.name}` : ''}
  &nbsp;&bull;&nbsp; Generated: ${new Date().toLocaleString()}
</div>
${[{label:'Executive Summary',val:pm.summary},{label:'Root Cause Analysis',val:pm.rootCause},{label:'Incident Timeline',val:pm.timeline},{label:'Business Impact',val:pm.impact},{label:'Lessons Learned',val:pm.lessonsLearned},{label:'Preventive Actions',val:pm.preventiveActions}].map(s=>`
<section><h2>${s.label}</h2><p>${s.val || 'Not provided.'}</p></section>
`).join('')}
</body></html>`;
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); }, 300);
    };

    const fields = [
        { key: 'summary', label: 'Summary / Executive Overview', rows: 3 },
        { key: 'rootCause', label: 'Root Cause Analysis', rows: 4 },
        { key: 'timeline', label: 'Incident Timeline', rows: 4 },
        { key: 'impact', label: 'Business Impact', rows: 3 },
        { key: 'lessonsLearned', label: 'Lessons Learned', rows: 3 },
        { key: 'preventiveActions', label: 'Preventive Actions / Action Items', rows: 3 },
    ];

    // View mode
    if (pm && !editing) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${pm.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                            {pm.status}
                        </span>
                        {pm.createdBy && <span className="text-xs text-slate-500 dark:text-slate-400">by {pm.createdBy.name}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={exportPDF}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            title="Export as PDF"
                        >
                            <FileDown className="h-4 w-4" /> Export PDF
                        </button>
                        {canEdit && (
                            <button onClick={() => setEditing(true)} className="px-3 py-1.5 text-sm font-medium text-primary border border-primary rounded hover:bg-primary hover:text-white transition-colors">
                                {t('common.edit')}
                            </button>
                        )}
                    </div>
                </div>
                {fields.map(f => (
                    <div key={f.key} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{f.label}</h4>
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                            {(pm?.[f.key as keyof typeof pm] as string) || '-'}
                        </p>
                    </div>
                ))}
            </div>
        );
    }

    // Edit / Create mode
    return (
        <div className="space-y-4">
            {!pm && !editing && (
                <div className="text-center py-8">
                    <p className="text-slate-500 dark:text-slate-400 mb-4">No post-mortem report yet.</p>
                    {canEdit && (
                        <button onClick={() => setEditing(true)} className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-secondary transition-colors">
                            Create Post-Mortem Report
                        </button>
                    )}
                </div>
            )}
            {editing && (
                <div className="space-y-4">
                    {fields.map(f => (
                        <div key={f.key}>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{f.label}</label>
                            <textarea
                                value={(form?.[f.key as keyof typeof form] as string) || ''}
                                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                                rows={f.rows}
                                className="w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white shadow-sm p-2 border text-sm focus:border-primary focus:ring-primary"
                            />
                        </div>
                    ))}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('common.status')}</label>
                        <select
                            value={form.status}
                            onChange={e => setForm({ ...form, status: e.target.value })}
                            className="rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white shadow-sm p-2 border text-sm"
                        >
                            <option value="DRAFT">Draft</option>
                            <option value="PUBLISHED">Published</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700">
                            {t('common.cancel')}
                        </button>
                        <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-secondary disabled:opacity-50">
                            {saving ? t('common.loading') : t('common.save')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

