/**
 * ConfirmDialog — replaces browser confirm() calls
 * Usage: const { confirm } = useConfirm();
 *        if (await confirm('Delete?', 'This cannot be undone.')) { ... }
 */
import { useState, useCallback, createContext, useContext, ReactNode, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmOptions {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'default';
}

interface ConfirmContextType {
    confirm: (title: string, message: string, variant?: 'danger' | 'default') => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const resolverRef = useRef<((value: boolean) => void) | null>(null);

    const confirm = useCallback((title: string, message: string, variant: 'danger' | 'default' = 'default'): Promise<boolean> => {
        return new Promise<boolean>(resolve => {
            resolverRef.current = resolve;
            setOptions({ title, message, variant });
        });
    }, []);

    const handleClose = useCallback((result: boolean) => {
        resolverRef.current?.(result);
        resolverRef.current = null;
        setOptions(null);
    }, []);

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            {options && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => handleClose(false)}
                    />
                    {/* Dialog */}
                    <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 animate-scale-in">
                        <div className="flex items-start gap-4">
                            {options.variant === 'danger' && (
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                </div>
                            )}
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-slate-900">
                                    {options.title}
                                </h3>
                                <p className="mt-2 text-sm text-slate-600">
                                    {options.message}
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => handleClose(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                {options.cancelLabel || 'Cancel'}
                            </button>
                            <button
                                onClick={() => handleClose(true)}
                                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${options.variant === 'danger'
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-accent hover:bg-accent/90'
                                    }`}
                                autoFocus
                            >
                                {options.confirmLabel || 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm(): ConfirmContextType {
    const ctx = useContext(ConfirmContext);
    if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
    return ctx;
}
