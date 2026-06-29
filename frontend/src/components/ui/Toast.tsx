/**
 * Toast notification system
 * Flat enterprise style, full dark mode.
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
    error:   (message: string) => void;
    warning: (message: string) => void;
    info:    (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let nextId = 0;

const ICONS = {
    success: CheckCircle,
    error:   XCircle,
    warning: AlertTriangle,
    info:    Info,
};

// Light / dark variants for each type
const STYLES: Record<ToastType, string> = {
    success: 'bg-white dark:bg-slate-800 border-l-4 border-emerald-500 text-slate-800 dark:text-slate-200',
    error:   'bg-white dark:bg-slate-800 border-l-4 border-red-500    text-slate-800 dark:text-slate-200',
    warning: 'bg-white dark:bg-slate-800 border-l-4 border-orange-500 text-slate-800 dark:text-slate-200',
    info:    'bg-white dark:bg-slate-800 border-l-4 border-blue-500   text-slate-800 dark:text-slate-200',
};

const ICON_COLORS: Record<ToastType, string> = {
    success: 'text-emerald-500',
    error:   'text-red-500',
    warning: 'text-orange-500',
    info:    'text-blue-500',
};

function ToastItem({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
    const Icon = ICONS[toast.type];

    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), 4000);
        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 rounded border border-slate-200 dark:border-slate-700 shadow-md animate-slide-in ${STYLES[toast.type]}`}
            role="alert"
        >
            <Icon className={`h-4 w-4 flex-shrink-0 ${ICON_COLORS[toast.type]}`} />
            <span className="text-sm font-medium flex-1">{toast.message}</span>
            <button
                onClick={() => onDismiss(toast.id)}
                className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
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
        error:   useCallback((msg: string) => addToast('error',   msg), [addToast]),
        warning: useCallback((msg: string) => addToast('warning', msg), [addToast]),
        info:    useCallback((msg: string) => addToast('info',    msg), [addToast]),
    };

    return (
        <ToastContext.Provider value={api}>
            {children}
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
