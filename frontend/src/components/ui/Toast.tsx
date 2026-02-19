/**
 * Toast notification system — replaces browser alert() calls
 * Usage: toast.success('Saved!'), toast.error('Failed'), toast.info('...')
 */
import { useState, useCallback, useEffect, createContext, useContext, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
    id: number;
    type: ToastType;
    message: string;
}

interface ToastContextType {
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let nextId = 0;

const ICONS = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const COLORS = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const ICON_COLORS = {
    success: 'text-emerald-500',
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
};

function ToastItem({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
    const Icon = ICONS[toast.type];

    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), 4000);
        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-slide-in ${COLORS[toast.type]}`}
            role="alert"
        >
            <Icon className={`h-5 w-5 flex-shrink-0 ${ICON_COLORS[toast.type]}`} />
            <span className="text-sm font-medium flex-1">{toast.message}</span>
            <button
                onClick={() => onDismiss(toast.id)}
                className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const dismiss = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((type: ToastType, message: string) => {
        const id = ++nextId;
        setToasts(prev => [...prev, { id, type, message }]);
    }, []);

    const api: ToastContextType = {
        success: useCallback((msg: string) => addToast('success', msg), [addToast]),
        error: useCallback((msg: string) => addToast('error', msg), [addToast]),
        warning: useCallback((msg: string) => addToast('warning', msg), [addToast]),
        info: useCallback((msg: string) => addToast('info', msg), [addToast]),
    };

    return (
        <ToastContext.Provider value={api}>
            {children}
            {/* Toast container — fixed top-right */}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
                {toasts.map(toast => (
                    <div key={toast.id} className="pointer-events-auto">
                        <ToastItem toast={toast} onDismiss={dismiss} />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextType {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}
