/**
 * KeyboardShortcutsModal — press "?" to open
 * Shows all shortcuts in the app grouped by category
 */
import { useEffect, useState } from 'react';
import { X, Keyboard } from 'lucide-react';

interface Shortcut {
    keys: string[];
    description: string;
}

interface Section {
    title: string;
    shortcuts: Shortcut[];
}

const SECTIONS: Section[] = [
    {
        title: 'Global',
        shortcuts: [
            { keys: ['Ctrl', 'K'], description: 'Open command palette' },
            { keys: ['?'], description: 'Show keyboard shortcuts' },
            { keys: ['Esc'], description: 'Close modal / palette' },
        ],
    },
    {
        title: 'Navigation',
        shortcuts: [
            { keys: ['G', 'D'], description: 'Go to Dashboard' },
            { keys: ['G', 'I'], description: 'Go to Incidents' },
            { keys: ['G', 'P'], description: 'Go to Procedures' },
            { keys: ['G', 'A'], description: 'Go to Admin' },
        ],
    },
    {
        title: 'Incidents',
        shortcuts: [
            { keys: ['N'], description: 'New incident (from incidents page)' },
            { keys: ['↑', '↓'], description: 'Navigate command palette results' },
            { keys: ['↵'], description: 'Open selected result' },
        ],
    },
    {
        title: 'Table',
        shortcuts: [
            { keys: ['Space'], description: 'Toggle row selection (when focused)' },
            { keys: ['Ctrl', 'A'], description: 'Select all (command palette only)' },
        ],
    },
];

const Kbd = ({ children }: { children: React.ReactNode }) => (
    <kbd className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-mono font-semibold shadow-sm">
        {children}
    </kbd>
);

export const KeyboardShortcutsModal = () => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            // Only trigger on bare '?' — not inside inputs
            const target = e.target as HTMLElement;
            const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
            if (e.key === '?' && !inInput && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                setOpen(prev => !prev);
            }
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

            {/* Panel */}
            <div
                className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <Keyboard className="h-4 w-4 text-primary" />
                        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Keyboard Shortcuts</h2>
                    </div>
                    <button onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
                    {SECTIONS.map(section => (
                        <div key={section.title}>
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                                {section.title}
                            </h3>
                            <div className="space-y-2.5">
                                {section.shortcuts.map((shortcut, i) => (
                                    <div key={i} className="flex items-center justify-between gap-4">
                                        <span className="text-xs text-slate-600 dark:text-slate-300">{shortcut.description}</span>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {shortcut.keys.map((key, ki) => (
                                                <Kbd key={ki}>{key}</Kbd>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Press <Kbd>?</Kbd> to toggle</span>
                    <span className="text-[11px] text-slate-400">Press <Kbd>Esc</Kbd> to close</span>
                </div>
            </div>
        </div>
    );
};
