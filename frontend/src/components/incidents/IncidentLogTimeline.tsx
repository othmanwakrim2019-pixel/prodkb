import { Paperclip, Download } from 'lucide-react';
import type { Log } from '../../types';

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
    onDownloadFile: (fileName: string) => void;
}

export const IncidentLogTimeline = ({ logs, onDownloadFile }: Props) => {
    if (!logs || logs.length === 0) {
        return <p className="text-sm text-slate-500 text-center py-4">No logs or files yet.</p>;
    }

    return (
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
                                    <div className="flex items-center text-sm text-accent mb-2">
                                        <Paperclip className="h-4 w-4 mr-2" />
                                        <button onClick={() => onDownloadFile(log.fileName!)} className="hover:underline text-left">
                                            {log.fileName} ({Math.round((log.fileSize || 0) / 1024)}KB)
                                        </button>
                                        <Download className="h-3 w-3 ml-2" />
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
    );
};
