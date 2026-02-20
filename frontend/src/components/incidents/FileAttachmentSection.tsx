import { Upload, X } from 'lucide-react';

interface Props {
    attachments: File[];
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: (index: number) => void;
}

export const FileAttachmentSection = ({ attachments, onFileChange, onRemove }: Props) => (
    <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">File Attachments</h2>
        <p className="text-sm text-slate-500 mb-4">
            Upload log files, screenshots, or any other relevant documents (max 10MB per file)
        </p>

        <div className="space-y-4">
            {/* File Upload Input */}
            <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 cursor-pointer transition-colors">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm font-medium">Choose Files</span>
                    <input
                        type="file"
                        multiple
                        onChange={onFileChange}
                        className="hidden"
                        accept=".txt,.log,.pdf,.png,.jpg,.jpeg,.json,.xml"
                    />
                </label>
                <span className="text-xs text-slate-500">
                    Accepted: .txt, .log, .pdf, .png, .jpg, .json, .xml
                </span>
            </div>

            {/* File List */}
            {attachments.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-slate-700">Selected Files ({attachments.length})</h3>
                    <div className="space-y-2">
                        {attachments.map((file, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-200"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-slate-400">
                                        <Upload className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{file.name}</p>
                                        <p className="text-xs text-slate-500">
                                            {(file.size / 1024).toFixed(2)} KB
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onRemove(index)}
                                    className="text-red-500 hover:text-red-700"
                                    title="Remove file"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    </div>
);
