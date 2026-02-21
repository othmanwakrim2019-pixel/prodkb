import { useState } from 'react';
import { Paperclip, Download, Eye, Trash2 } from 'lucide-react';
import type { Log } from '../../types';
import { FilePreviewModal } from './FilePreviewModal';
import { incidentService } from '../../services/incident.service';

// ── Helpers ──
function groupLogsByDate(logs: Log[]): Record<string, Log[]> {
    const groups: Record<string, Log[]> = {};
    logs.forEach(log => {
        const date = new Date(log.createdAt).toISOString().split('T')[0];
        if (!groups[date]) groups[date] = [];
        groups[date].push(log);
    });
    return Object.fromEntries(
        Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
    );
}

function formatFullDate(dateString: string): string {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}

interface Props {
    logs: Log[];
    incidentId: string;
    currentUserId?: string;
    onDownloadFile: (fileName: string) => void;
    onDeleteFile?: (fileName: string) => Promise<boolean>;
}

export const IncidentLogTimeline = ({ logs, incidentId, currentUserId, onDownloadFile, onDeleteFile }: Props) => {
    const [previewFile, setPreviewFile] = useState<{
        fileName: string;
        mimeType?: string;
    } | null>(null);

    if (!logs || logs.length === 0) {
        return <p className="text-sm text-slate-500 text-center py-4">No logs or files yet.</p>;
    }

    return (
        <>
            <div className="space-y-6">
                {Object.entries(groupLogsByDate(logs)).map(([date, logsForDate]) => (
                    <div key={date}>
                        <div className="mb-3">
                            <h4 className="text-sm font-semibold text-slate-700 px-1">{formatFullDate(date)}</h4>
                        </div>
                        <div className="space-y-3">
                            {logsForDate.map((log: Log) => (
                                <div key={log.id} className="bg-slate-50 p-4 rounded-md border border-slate-200">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-slate-500 uppercase">{log.logType}</span>
                                            {log.createdBy && <span className="text-xs text-slate-500 font-semibold">by {log.createdBy.name}</span>}
                                        </div>
                                        <span className="text-xs text-slate-400">
                                            {new Date(log.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    {log.fileName && (
                                        <div className="flex items-center gap-2 text-sm mb-2 p-2 bg-white rounded border border-slate-100">
                                            <Paperclip className="h-4 w-4 text-slate-400 shrink-0" />
                                            <span className="text-slate-700 truncate flex-1">
                                                {log.fileName}
                                                <span className="text-slate-400 ml-1">({Math.round((log.fileSize || 0) / 1024)}KB)</span>
                                            </span>
                                            <button
                                                onClick={() => setPreviewFile({
                                                    fileName: log.fileName!,
                                                    mimeType: log.mimeType,
                                                })}
                                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                                title="Preview file"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                Preview
                                            </button>
                                            <button
                                                onClick={() => onDownloadFile(log.fileName!)}
                                                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                                                title="Download file"
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                                Download
                                            </button>
                                            {onDeleteFile && currentUserId && log.createdBy?.id === currentUserId && (
                                                <button
                                                    onClick={async () => {
                                                        if (window.confirm(`Delete "${log.fileName}"? This cannot be undone.`)) {
                                                            await onDeleteFile(log.fileName!);
                                                        }
                                                    }}
                                                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                                    title="Delete file"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    {log.errorMessage && <p className="text-red-600 font-medium text-sm mb-2">{log.errorMessage}</p>}
                                    {log.rawLog && <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap overflow-x-auto">{log.rawLog}</pre>}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* File Preview Modal */}
            {previewFile && (
                <FilePreviewModal
                    isOpen={true}
                    onClose={() => setPreviewFile(null)}
                    fileName={previewFile.fileName}
                    mimeType={previewFile.mimeType}
                    previewUrl={incidentService.getFilePreviewUrl(incidentId, previewFile.fileName)}
                    onDownload={() => {
                        onDownloadFile(previewFile.fileName);
                        setPreviewFile(null);
                    }}
                />
            )}
        </>
    );
};
