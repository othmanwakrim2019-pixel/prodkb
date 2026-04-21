import { useState, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import { Upload, Download, CheckCircle, AlertTriangle, X, FileText } from 'lucide-react';
import type { PlanningPeriod } from '../model/planning';
import { planningService } from '../api/planning.service';

interface ImportResult {
    instance: { id: string; name: string };
    jobsCreated: number;
    skipped: string[];
    warnings: string[];
}

interface ParsedRow {
    ref: string;
    task_type: string;
    date: string;
    time: string;
    task_name: string;
    system_name: string;
    job_code: string;
    support_contact: string;
    depends_on: string;
}

interface ImportCsvModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImported: (instanceId: string) => void;
}

const PERIODS: { value: PlanningPeriod; label: string }[] = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'annual', label: 'Annual' },
];

export const ImportCsvModal = ({ isOpen, onClose, onImported }: ImportCsvModalProps) => {
    const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
    const [instanceName, setInstanceName] = useState('');
    const [period, setPeriod] = useState<PlanningPeriod>('monthly');
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const reset = () => {
        setStep('upload');
        setFile(null);
        setParsedRows([]);
        setInstanceName('');
        setPeriod('monthly');
        setImporting(false);
        setResult(null);
        setError('');
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleFileChange = useCallback((f: File | null) => {
        if (!f) return;
        setFile(f);
        setError('');

        Papa.parse<ParsedRow>(f, {
            header: true,
            skipEmptyLines: true,
            comments: '#',
            transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
            complete: (results) => {
                const rows = results.data.filter(r => r.ref?.trim());
                if (rows.length === 0) {
                    setError('No valid rows found. Make sure the file has a "ref" column and valid data rows.');
                    return;
                }
                setParsedRows(rows);
                // Auto-fill instance name from file name
                if (!instanceName) {
                    setInstanceName(f.name.replace(/\.csv$/i, '').replace(/_/g, ' '));
                }
                setStep('preview');
            },
            error: (err) => {
                setError(`Failed to parse CSV: ${err.message}`);
            },
        });
    }, [instanceName]);

    const handleImport = async () => {
        if (!file || !instanceName.trim()) return;
        setImporting(true);
        setError('');

        try {
            const importResult = await planningService.importFromCsv(file, instanceName.trim(), period);
            setResult(importResult);
            setStep('result');
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(msg || 'Import failed. Please check your CSV and try again.');
        } finally {
            setImporting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Upload className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-800">Import Planning from CSV</h2>
                            <p className="text-xs text-slate-500">
                                {step === 'upload' && 'Upload a CSV file to create a planning instance automatically'}
                                {step === 'preview' && `${parsedRows.length} tasks found — review before importing`}
                                {step === 'result' && 'Import complete'}
                            </p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">

                    {error && (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* ── STEP 1: Upload ── */}
                    {step === 'upload' && (
                        <div className="space-y-4">
                            {/* Drop zone */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => { e.preventDefault(); handleFileChange(e.dataTransfer.files[0]); }}
                                className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-10 text-center cursor-pointer transition-colors group"
                            >
                                <Upload className="w-10 h-10 text-slate-300 group-hover:text-indigo-400 mx-auto mb-3 transition-colors" />
                                <p className="text-sm font-medium text-slate-600">Click to select a CSV file or drag & drop</p>
                                <p className="text-xs text-slate-400 mt-1">Max 5 MB · .csv files only</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={e => handleFileChange(e.target.files?.[0] || null)}
                                />
                            </div>

                            {/* Download template */}
                            <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-slate-400" />
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">Need the template?</p>
                                        <p className="text-xs text-slate-500">Download the CSV structure with examples</p>
                                    </div>
                                </div>
                                <a
                                    href="/planning_template.csv"
                                    download="planning_template.csv"
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                >
                                    <Download className="w-3.5 h-3.5" /> Download
                                </a>
                            </div>

                            {/* Format reminder */}
                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                                <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Expected columns</p>
                                <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
                                    {['ref', 'task_type', 'date', 'time', 'task_name', 'system_name', 'job_code', 'support_contact', 'depends_on'].map(col => (
                                        <span key={col} className="font-mono bg-white border border-slate-200 rounded px-1.5 py-0.5">{col}</span>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-400 mt-2">task_type: <code>BATCH</code> or <code>MANUAL</code> · depends_on: comma-separated refs e.g. <code>T1,T3</code></p>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: Preview ── */}
                    {step === 'preview' && (
                        <div className="space-y-4">
                            {/* Instance config */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Instance Name</label>
                                    <input
                                        type="text"
                                        value={instanceName}
                                        onChange={e => setInstanceName(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder='e.g. "Fin de Mois Février 2026"'
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Period</label>
                                    <select
                                        value={period}
                                        onChange={e => setPeriod(e.target.value as PlanningPeriod)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        {PERIODS.map(p => (
                                            <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Preview table */}
                            <div className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 overflow-hidden">
                                <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Preview ({parsedRows.length} tasks)</span>
                                    <button onClick={() => { setStep('upload'); setFile(null); setParsedRows([]); }} className="text-xs text-slate-400 hover:text-slate-600">
                                        ← Change file
                                    </button>
                                </div>
                                <div className="overflow-x-auto max-h-64">
                                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                                            <tr>
                                                {['Ref', 'Type', 'Date', 'Time', 'Task', 'Support', 'Depends on'].map(h => (
                                                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                                            {parsedRows.map((row, i) => (
                                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-none">
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-mono text-slate-500">{row.ref}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                                                        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${row.task_type?.toUpperCase() === 'BATCH' ? 'bg-blue-600 text-white dark:bg-blue-900/40 dark:text-blue-400' : 'bg-violet-600 text-white dark:bg-violet-900/40 dark:text-violet-400'}`}>
                                                            {row.task_type?.toUpperCase() === 'BATCH' ? '⚙️ BATCH' : '👤 MANUAL'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600">{row.date}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600">{row.time || '08:00'}</td>
                                                    <td className="px-4 py-2 text-sm text-slate-700 max-w-[200px] truncate" title={row.task_name}>
                                                        {row.task_name || `${row.system_name} / ${row.job_code}`}
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-500 truncate max-w-[100px]">{row.support_contact || '—'}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-mono text-slate-400">{row.depends_on || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: Result ── */}
                    {step === 'result' && result && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4">
                                <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-emerald-800">Import Successful!</p>
                                    <p className="text-sm text-emerald-700">
                                        Created <strong>"{result.instance.name}"</strong> with <strong>{result.jobsCreated} tasks</strong>
                                    </p>
                                </div>
                            </div>

                            {result.skipped.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-amber-700 mb-2">{result.skipped.length} Row(s) Skipped</p>
                                    <ul className="space-y-1">
                                        {result.skipped.map((s, i) => (
                                            <li key={i} className="text-xs text-amber-700">• {s}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {result.warnings.length > 0 && (
                                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-orange-700 mb-2">{result.warnings.length} Warning(s)</p>
                                    <ul className="space-y-1">
                                        {result.warnings.map((w, i) => (
                                            <li key={i} className="text-xs text-orange-700">• {w}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 flex-shrink-0 bg-slate-50/50">
                    <button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        {step === 'result' ? 'Close' : 'Cancel'}
                    </button>

                    <div className="flex items-center gap-2">
                        {step === 'preview' && (
                            <button
                                onClick={handleImport}
                                disabled={importing || !instanceName.trim()}
                                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors"
                            >
                                {importing ? (
                                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Importing...</>
                                ) : (
                                    <><Upload className="w-4 h-4" /> Import {parsedRows.length} Tasks</>
                                )}
                            </button>
                        )}

                        {step === 'result' && result && (
                            <button
                                onClick={() => { onImported(result.instance.id); handleClose(); }}
                                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                            >
                                <CheckCircle className="w-4 h-4" /> View Instance
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

