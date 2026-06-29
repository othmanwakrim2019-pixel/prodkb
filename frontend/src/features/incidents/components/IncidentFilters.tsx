import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X, Search, Calendar, AlertCircle, Activity, ChevronDown, Bookmark, BookmarkPlus, Trash2 } from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import { useFilterPresets } from '../hooks/useFilterPresets';

export const IncidentFilters = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [status, setStatus] = useState(searchParams.get('status') || '');
    const [severity, setSeverity] = useState(searchParams.get('severity') || '');
    const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
    const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showSavePreset, setShowSavePreset] = useState(false);
    const [presetName, setPresetName] = useState('');
    const datePickerRef = useRef<HTMLDivElement>(null);
    const { presets, savePreset, deletePreset, applyPreset } = useFilterPresets();

    // Sync local state with URL params
    useEffect(() => {
        setStatus(searchParams.get('status') || '');
        setSeverity(searchParams.get('severity') || '');
        setStartDate(searchParams.get('startDate') || '');
        setEndDate(searchParams.get('endDate') || '');
        setSearch(searchParams.get('search') || '');
    }, [searchParams]);

    // Close date picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
                setShowDatePicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearch(value);
        updateParams('search', value);
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setStatus(value);
        updateParams('status', value);
    };

    const handleSeverityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setSeverity(value);
        updateParams('severity', value);
    };

    const handleDateChange = (key: 'startDate' | 'endDate', value: string) => {
        if (key === 'startDate') setStartDate(value);
        if (key === 'endDate') setEndDate(value);
        updateParams(key, value);
    };

    const applyQuickRange = (days: number) => {
        const today = new Date();
        const start = subDays(today, days);
        const startStr = start.toISOString().split('T')[0];
        const endStr = today.toISOString().split('T')[0];

        setStartDate(startStr);
        setEndDate(endStr);

        const newParams = new URLSearchParams(searchParams);
        newParams.set('startDate', startStr);
        newParams.set('endDate', endStr);
        setSearchParams(newParams);
        setShowDatePicker(false);
    };

    const updateParams = (key: string, value: string) => {
        const newParams = new URLSearchParams(searchParams);
        if (value) {
            newParams.set(key, value);
        } else {
            newParams.delete(key);
        }
        setSearchParams(newParams);
    };

    const clearFilters = () => {
        setSearchParams(new URLSearchParams());
    };

    const handleSavePreset = () => {
        const ok = savePreset(presetName, searchParams);
        if (ok) { setPresetName(''); setShowSavePreset(false); }
    };

    const hasFilters = Boolean(status || severity || startDate || endDate || search);

    // Helper to display formatted date range
    const getDateLabel = () => {
        if (!startDate && !endDate) return 'Date Range';

        try {
            const start = startDate ? format(parseISO(startDate), 'MMM d') : '';
            const end = endDate ? format(parseISO(endDate), 'MMM d') : '...';

            if (startDate && !endDate) return `From ${start}`;
            if (!startDate && endDate) return `Until ${end}`;
            return `${start} - ${end}`;
        } catch (e) {
            return 'Date Range';
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
            {/* Presets pills row */}
            {presets.length > 0 && (
                <div className="px-4 pt-3 pb-0 flex flex-wrap gap-2 items-center">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Bookmark className="h-3 w-3" /> Saved
                    </span>
                    {presets.map(preset => (
                        <span key={preset.id} className="inline-flex items-center gap-1 group">
                            <button
                                onClick={() => applyPreset(preset, setSearchParams)}
                                className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-300 hover:bg-primary/20 transition-colors"
                            >
                                {preset.name}
                            </button>
                            <button
                                onClick={() => deletePreset(preset.id)}
                                className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete preset"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Header / Search Bar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold text-sm">
                    <Filter className="h-4 w-4 text-primary dark:text-indigo-400" />
                    <span>Filter Incidents</span>
                </div>

                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={handleSearchChange}
                        placeholder="Search by title, description..."
                        className="block w-full pl-9 pr-4 py-2 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 focus:border-primary focus:ring-primary sm:text-sm transition-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                </div>
            </div>

            {/* Filter Options grid */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                {/* Status Filter */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="h-3 w-3 text-slate-400" /> Status
                    </label>
                    <select
                        value={status}
                        onChange={handleStatusChange}
                        className="block w-full rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 focus:border-primary focus:ring-primary text-sm py-2 px-3 transition-none outline-none cursor-pointer"
                    >
                        <option value="">All Statuses</option>
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                    </select>
                </div>

                {/* Severity Filter */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertCircle className="h-3 w-3 text-slate-400" /> Severity
                    </label>
                    <select
                        value={severity}
                        onChange={handleSeverityChange}
                        className="block w-full rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 focus:border-primary focus:ring-primary text-sm py-2 px-3 transition-none outline-none cursor-pointer"
                    >
                        <option value="">All Severities</option>
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                </div>

                {/* Date Filter Popover */}
                <div className="relative space-y-1.5" ref={datePickerRef}>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-slate-400" /> Date
                    </label>
                    <button
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className={`block w-full text-left pl-3 pr-10 py-2 rounded border focus:outline-none focus:ring-1 focus:ring-primary text-sm relative transition-none ${startDate || endDate ? 'border-primary text-primary bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 bg-white dark:bg-slate-900'
                            }`}
                    >
                        <span className="block truncate font-medium">{getDateLabel()}</span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronDown className={`h-4 w-4 ${startDate || endDate ? 'text-primary' : 'text-slate-400'}`} />
                        </span>
                    </button>

                    {/* Popover Content */}
                    {showDatePicker && (
                        <div className="absolute z-50 mt-2 w-full md:w-72 bg-white dark:bg-slate-800 shadow-lg rounded border border-slate-200 dark:border-slate-700 p-4 right-0 md:right-auto">
                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 mb-2 uppercase">Quick Select</div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => applyQuickRange(7)}
                                            className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 text-slate-800 rounded-md transition-colors flex-1"
                                        >
                                            Last 7 Days
                                        </button>
                                        <button
                                            onClick={() => applyQuickRange(30)}
                                            className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 text-slate-800 rounded-md transition-colors flex-1"
                                        >
                                            Last 30 Days
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Custom Range</div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">From</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => handleDateChange('startDate', e.target.value)}
                                            className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-1.5 px-3 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">To</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => handleDateChange('endDate', e.target.value)}
                                            className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-1.5 px-3 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                                    <button
                                        onClick={() => setShowDatePicker(false)}
                                        className="text-sm text-primary dark:text-indigo-400 font-medium hover:text-primary-hover dark:hover:text-indigo-300 transition-colors"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Active Filters / Clear + Save Preset */}
            {hasFilters && (
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3 justify-end">
                    {/* Save as preset */}
                    {showSavePreset ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={presetName}
                                onChange={e => setPresetName(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleSavePreset(); if (e.key === 'Escape') setShowSavePreset(false); }}
                                placeholder="Preset name..."
                                autoFocus
                                className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-primary"
                            />
                            <button onClick={handleSavePreset} className="px-2.5 py-1 rounded bg-primary text-white text-xs font-semibold hover:bg-primary-hover">Save</button>
                            <button onClick={() => setShowSavePreset(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowSavePreset(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-primary dark:text-blue-400 border border-primary/30 hover:bg-primary/5 transition-colors"
                        >
                            <BookmarkPlus className="h-3.5 w-3.5" /> Save as preset
                        </button>
                    )}
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                    >
                        <X className="h-4 w-4" /> Clear All Filters
                    </button>
                </div>
            )}
        </div>
    );
};
