/**
 * CommandPalette — Global Ctrl+K / Cmd+K overlay
 * Fuzzy searches incidents from cache + static nav pages + quick actions
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, AlertCircle, LayoutDashboard, BookOpen, CalendarClock,
    ActivitySquare, Settings, Plus, ArrowRight, X,
} from 'lucide-react';
import { incidentService } from '../features/incidents/api/incident.service';
import type { Incident } from '../types';
import { APP_PATHS } from '../app/route-meta';

// ── Static pages / actions ───────────────────────────────────────────────────
const STATIC_ITEMS = [
    { type: 'page' as const, label: 'Dashboard', path: APP_PATHS.home, icon: LayoutDashboard },
    { type: 'page' as const, label: 'Incidents', path: APP_PATHS.incidents, icon: AlertCircle },
    { type: 'page' as const, label: 'Procedures', path: APP_PATHS.procedures, icon: BookOpen },
    { type: 'page' as const, label: 'Planning', path: APP_PATHS.planning, icon: CalendarClock },
    { type: 'page' as const, label: 'Public Status', path: APP_PATHS.status, icon: ActivitySquare },
    { type: 'page' as const, label: 'Administration', path: APP_PATHS.admin, icon: Settings },
    { type: 'action' as const, label: 'New Incident', path: APP_PATHS.incidentNew, icon: Plus },
    { type: 'action' as const, label: 'New Procedure', path: APP_PATHS.procedureNew, icon: Plus },
];

const SEV_COLOURS: Record<string, string> = {
    Critical: 'bg-red-700 text-white',
    High: 'bg-orange-600 text-white',
    Medium: 'bg-yellow-500 text-white',
    Low: 'bg-emerald-600 text-white',
};

const STATUS_COLOURS: Record<string, string> = {
    Open: 'bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-400',
    'In Progress': 'bg-yellow-200 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-400',
    Resolved: 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-400',
    Closed: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
};

// ── Main Component ────────────────────────────────────────────────────────────
export const CommandPalette = () => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    // ── Open / close ────────────────────────────────────────────────────────
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setOpen(prev => !prev);
            }
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    useEffect(() => {
        if (open) {
            setQuery('');
            setSelected(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    // ── Fetch incidents on query change ────────────────────────────────────
    const fetchIncidents = useCallback(async (q: string) => {
        if (!q.trim()) { setIncidents([]); return; }
        setLoading(true);
        try {
            const res = await incidentService.getAll({ search: q, limit: 6 });
            setIncidents(res.data ?? []);
        } catch { setIncidents([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchIncidents(query), 200);
        return () => clearTimeout(debounceRef.current);
    }, [query, fetchIncidents]);

    // ── Build result list ───────────────────────────────────────────────────
    const filteredStatic = STATIC_ITEMS.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase())
    );

    type ResultItem =
        | { kind: 'incident'; incident: Incident }
        | { kind: 'static'; item: typeof STATIC_ITEMS[0] };

    const results: ResultItem[] = [
        ...incidents.map(i => ({ kind: 'incident' as const, incident: i })),
        ...filteredStatic.map(i => ({ kind: 'static' as const, item: i })),
    ];

    // ── Keyboard navigation ─────────────────────────────────────────────────
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
        if (e.key === 'Enter' && results[selected]) {
            const r = results[selected];
            navigate(r.kind === 'incident' ? `/incidents/${r.incident.id}` : r.item.path);
            setOpen(false);
        }
    };

    // Scroll selected into view
    useEffect(() => {
        const el = listRef.current?.querySelector(`[data-idx="${selected}"]`);
        el?.scrollIntoView({ block: 'nearest' });
    }, [selected]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]"
            onClick={() => setOpen(false)}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

            {/* Panel */}
            <div
                className="relative w-full max-w-xl mx-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                    <Search className="h-4 w-4 text-slate-400 shrink-0" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={e => { setQuery(e.target.value); setSelected(0); }}
                        onKeyDown={handleKeyDown}
                        placeholder="Search incidents, pages, actions..."
                        className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none"
                    />
                    {loading && <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />}
                    <button onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>

                {/* Results */}
                <div ref={listRef} className="max-h-96 overflow-y-auto py-2">
                    {results.length === 0 && query && !loading && (
                        <p className="px-4 py-6 text-sm text-center text-slate-400">No results for "{query}"</p>
                    )}
                    {results.length === 0 && !query && (
                        <div className="px-4 py-5 space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Quick Nav</p>
                            {STATIC_ITEMS.slice(0, 6).map((item, i) => {
                                const Icon = item.icon;
                                return (
                                    <button key={i} onClick={() => { navigate(item.path); setOpen(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                        <Icon className="h-4 w-4 text-slate-400" />
                                        {item.label}
                                        <ArrowRight className="h-3.5 w-3.5 ml-auto text-slate-300" />
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Incidents section */}
                    {incidents.length > 0 && (
                        <div className="px-2 pb-1">
                            <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Incidents</p>
                            {incidents.map((inc, i) => {
                                const idx = i;
                                const isSelected = selected === idx;
                                return (
                                    <button
                                        key={inc.id}
                                        data-idx={idx}
                                        onClick={() => { navigate(`/incidents/${inc.id}`); setOpen(false); }}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors ${isSelected ? 'bg-primary text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                    >
                                        <AlertCircle className={`h-4 w-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                                        <span className={`flex-1 text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                                            {inc.title}
                                        </span>
                                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${isSelected ? 'bg-white/20 text-white' : (SEV_COLOURS[inc.severity] ?? 'bg-slate-200 text-slate-700')}`}>
                                            {inc.severity}
                                        </span>
                                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${isSelected ? 'bg-white/20 text-white' : (STATUS_COLOURS[inc.status] ?? '')}`}>
                                            {inc.status}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Pages / actions section */}
                    {filteredStatic.length > 0 && (
                        <div className="px-2 pt-1">
                            {incidents.length > 0 && <div className="mx-2 my-1 border-t border-slate-100 dark:border-slate-800" />}
                            <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Pages & Actions</p>
                            {filteredStatic.map((item, i) => {
                                const idx = incidents.length + i;
                                const isSelected = selected === idx;
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.path}
                                        data-idx={idx}
                                        onClick={() => { navigate(item.path); setOpen(false); }}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${isSelected ? 'bg-primary text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                    >
                                        <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                                        <span className="flex-1 text-left">{item.label}</span>
                                        <span className={`text-[10px] uppercase tracking-wide ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>
                                            {item.type}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer hint */}
                <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 text-[11px] text-slate-400">
                    <span><kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono">↑↓</kbd> navigate</span>
                    <span><kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono">↵</kbd> open</span>
                    <span><kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono">esc</kbd> close</span>
                    <span className="ml-auto"><kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono">Ctrl K</kbd></span>
                </div>
            </div>
        </div>
    );
};
