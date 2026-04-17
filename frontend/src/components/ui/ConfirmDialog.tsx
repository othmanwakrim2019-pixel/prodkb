/**
 * ConfirmDialog — replaces browser confirm() calls
 * Flat enterprise panel, full dark mode support.
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
                        className="absolute inset-0 bg-black/50"
                        onClick={() => handleClose(false)}
                    />
                    {/* Dialog */}
                    <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg rounded max-w-sm w-full mx-4 animate-scale-in">
                        {/* Header stripe for danger */}
                        {options.variant === 'danger' && (
                            <div className="h-1 bg-red-600 rounded-t w-full" />
                        )}
                        <div className="p-5">
                            <div className="flex items-start gap-3">
                                {options.variant === 'danger' && (
                                    <div className="flex-shrink-0 h-8 w-8 rounded bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        {options.title}
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        {options.message}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-5 flex justify-end gap-2">
                                <button
                                    onClick={() => handleClose(false)}
                                    className="ent-btn-secondary"
                                >
                                    {options.cancelLabel || 'Cancel'}
                                </button>
                                <button
                                    onClick={() => handleClose(true)}
                                    className={options.variant === 'danger' ? 'ent-btn-danger' : 'ent-btn-primary'}
                                    autoFocus
                                >
                                    {options.confirmLabel || 'Confirm'}
                                </button>
                            </div>
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
