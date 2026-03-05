import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/axios';
import { useTranslation } from 'react-i18next';

interface PostMortem {
    id: string;
    summary: string;
    rootCause: string;
    timeline: string;
    impact: string;
    lessonsLearned: string;
    preventiveActions: string;
    status: string;
    createdBy?: { name: string };
    updatedAt: string;
}

interface Props {
    incidentId: string;
    canEdit: boolean;
}

export const PostMortemTab = ({ incidentId, canEdit }: Props) => {
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
            const res = await api.get(`/api/v1/incidents/${incidentId}/postmortem`);
            if (res.data?.data) {
                setPm(res.data.data);
                setForm({
                    summary: res.data.data.summary || '',
                    rootCause: res.data.data.rootCause || '',
                    timeline: res.data.data.timeline || '',
                    impact: res.data.data.impact || '',
                    lessonsLearned: res.data.data.lessonsLearned || '',
                    preventiveActions: res.data.data.preventiveActions || '',
                    status: res.data.data.status || 'DRAFT',
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
            const res = await api.post(`/api/v1/incidents/${incidentId}/postmortem`, form);
            setPm(res.data.data);
            setEditing(false);
        } catch (err) {
            console.error('Failed to save post-mortem', err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <p className="text-sm text-slate-400 py-4 text-center">{t('common.loading')}</p>;

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
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${pm.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {pm.status}
                        </span>
                        {pm.createdBy && <span className="text-xs text-slate-500">by {pm.createdBy.name}</span>}
                    </div>
                    {canEdit && (
                        <button onClick={() => setEditing(true)} className="px-3 py-1.5 text-sm font-medium text-primary border border-primary rounded-md hover:bg-primary hover:text-white transition-colors">
                            {t('common.edit')}
                        </button>
                    )}
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

