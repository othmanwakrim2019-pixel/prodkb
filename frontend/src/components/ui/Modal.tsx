/**
 * Modal — reusable dialog component
 * Flat enterprise style: no rounded-xl, no shadow-2xl.
 * Full dark mode support.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZES: Record<NonNullable<ModalProps['size']>, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
};

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
            {/* Backdrop */}
            <div
                ref={overlayRef}
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />
            {/* Panel */}
            <div className={`relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg rounded ${SIZES[size]} w-full mx-4 animate-scale-in`}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                {/* Body */}
                <div className="px-5 py-4 max-h-[70vh] overflow-y-auto text-sm text-slate-700 dark:text-slate-300">
                    {children}
                </div>
                {/* Footer */}
                {footer && (
                    <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2 bg-slate-50 dark:bg-slate-800/50">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
