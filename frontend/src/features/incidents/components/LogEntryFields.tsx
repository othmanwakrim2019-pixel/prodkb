import { UseFieldArrayReturn, UseFormRegister } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';

interface LogEntry {
    logType: string;
    rawLog: string;
    errorMessage: string;
}

interface Props {
    fields: UseFieldArrayReturn<{ logs: LogEntry[] }>['fields'];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    register: UseFormRegister<any>;
    append: (value: LogEntry) => void;
    remove: (index: number) => void;
}

export const LogEntryFields = ({ fields, register, append, remove }: Props): JSX.Element => (
    <div className="space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-lg font-semibold text-slate-900">Logs & Evidence</h2>
            <button
                type="button"
                onClick={() => append({ logType: 'raw_log', rawLog: '', errorMessage: '' })}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-accent bg-blue-100 hover:bg-blue-200 focus:outline-none"
            >
                <Plus className="h-4 w-4 mr-1" />
                Add Log Entry
            </button>
        </div>

        <div className="space-y-4">
            {fields.map((field, index) => (
                <div key={field.id} className="bg-slate-50 p-4 rounded-md border border-slate-200 relative">
                    {fields.length > 1 && (
                        <button
                            type="button"
                            onClick={() => remove(index)}
                            className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Error Message</label>
                            <input
                                {...register(`logs.${index}.errorMessage` as const)}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                placeholder="Short error message or code"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Raw Log / Stack Trace</label>
                            <textarea
                                {...register(`logs.${index}.rawLog` as const)}
                                rows={3}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border font-mono text-xs"
                                placeholder="Paste logs, stack traces, or error details here..."
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);
