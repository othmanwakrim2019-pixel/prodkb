import { X } from 'lucide-react';

interface EditModalProps {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    children: React.ReactNode;
}

export const EditModal = ({ title, isOpen, onClose, onSave, children }: EditModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mb-6">
                    {children}
                </div>

                <div className="flex justify-end gap-2 border-t pt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSave}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
