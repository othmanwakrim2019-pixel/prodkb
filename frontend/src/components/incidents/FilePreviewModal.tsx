import { X, Download, FileText } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    fileName: string;
    mimeType?: string;
    previewUrl: string;
    onDownload: () => void;
}

/** Detect which preview renderer to use based on MIME type */
function getPreviewType(mimeType?: string): 'image' | 'pdf' | 'text' | 'video' | 'unsupported' {
    if (!mimeType) return 'unsupported';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('video/')) return 'video';
    if (
        mimeType.startsWith('text/') ||
        mimeType === 'application/json' ||
        mimeType === 'application/xml'
    ) return 'text';
    return 'unsupported';
}

export const FilePreviewModal = ({ isOpen, onClose, fileName, mimeType, previewUrl, onDownload }: Props) => {
    if (!isOpen) return null;

    const previewType = getPreviewType(mimeType);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="text-sm font-medium text-slate-700 truncate">{fileName}</span>
                        {mimeType && (
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                                {mimeType}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                        <button
                            onClick={onDownload}
                            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors"
                            title="Download file"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Download
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
                            title="Close preview"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Preview content */}
                <div className="flex-1 overflow-auto bg-slate-100 flex items-center justify-center min-h-[300px]">
                    {previewType === 'image' && (
                        <img
                            src={previewUrl}
                            alt={fileName}
                            className="max-w-full max-h-[75vh] object-contain"
                        />
                    )}

                    {previewType === 'pdf' && (
                        <iframe
                            src={previewUrl}
                            title={fileName}
                            className="w-full h-[75vh] border-0"
                        />
                    )}

                    {previewType === 'video' && (
                        <video
                            src={previewUrl}
                            controls
                            className="max-w-full max-h-[75vh]"
                        >
                            Your browser does not support the video tag.
                        </video>
                    )}

                    {previewType === 'text' && (
                        <iframe
                            src={previewUrl}
                            title={fileName}
                            className="w-full h-[75vh] border-0 bg-white font-mono text-sm"
                        />
                    )}

                    {previewType === 'unsupported' && (
                        <div className="text-center py-12">
                            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 text-sm mb-1">Preview not available for this file type</p>
                            <p className="text-slate-400 text-xs mb-4">{mimeType || 'Unknown type'}</p>
                            <button
                                onClick={onDownload}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Download File
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
