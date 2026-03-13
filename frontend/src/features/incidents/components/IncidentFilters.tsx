import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X, Search, Calendar, AlertCircle, Activity, ChevronDown } from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';

export const IncidentFilters = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [status, setStatus] = useState(searchParams.get('status') || '');
    const [severity, setSeverity] = useState(searchParams.get('severity') || '');
    const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
    const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
    const [search, setSearch] = useState(searchParams.get('search') || '');

    const [showDatePicker, setShowDatePicker] = useState(false);
    const datePickerRef = useRef<HTMLDivElement>(null);

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
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            {/* Header / Search Bar */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-slate-700 font-semibold">
                    <Filter className="h-5 w-5 text-primary" />
                    <span>Filter Incidents</span>
                </div>

                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={handleSearchChange}
                        placeholder="Search by title, description..."
                        className="block w-full pl-10 pr-4 py-2 rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm transition-shadow"
                    />
                </div>
            </div>

            {/* Filter Options grid */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                {/* Status Filter */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 uppercase flex items-center gap-1">
                        <Activity className="h-3 w-3" /> Status
                    </label>
                    <select
                        value={status}
                        onChange={handleStatusChange}
                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2"
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
                    <label className="text-xs font-medium text-slate-500 uppercase flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Severity
                    </label>
                    <select
                        value={severity}
                        onChange={handleSeverityChange}
                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2"
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
                    <label className="text-xs font-medium text-slate-500 uppercase flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Date
                    </label>
                    <button
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className={`block w-full text-left pl-3 pr-10 py-2 rounded-md border shadow-sm focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm relative ${startDate || endDate ? 'border-primary text-primary bg-blue-50/50' : 'border-slate-300 text-slate-900'
                            }`}
                    >
                        <span className="block truncate">{getDateLabel()}</span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                        </span>
                    </button>

                    {/* Popover Content */}
                    {showDatePicker && (
                        <div className="absolute z-50 mt-1 w-full md:w-72 bg-white shadow-xl rounded-md border border-slate-200 p-4 animate-in fade-in zoom-in-95 duration-100 right-0 md:right-auto">
                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs font-medium text-slate-500 mb-2">Quick Select</div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => applyQuickRange(7)}
                                            className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-md transition-colors flex-1"
                                        >
                                            Last 7 Days
                                        </button>
                                        <button
                                            onClick={() => applyQuickRange(30)}
                                            className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-md transition-colors flex-1"
                                        >
                                            Last 30 Days
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="text-xs font-medium text-slate-500">Custom Range</div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-400 uppercase">From</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => handleDateChange('startDate', e.target.value)}
                                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-1.5"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-400 uppercase">To</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => handleDateChange('endDate', e.target.value)}
                                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-1.5"
                                        />
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-slate-100 flex justify-end">
                                    <button
                                        onClick={() => setShowDatePicker(false)}
                                        className="text-xs text-primary font-medium hover:underline"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Active Filters / Clear */}
            {hasFilters && (
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                    >
                        <X className="h-3 w-3" />
                        Clear All Filters
                    </button>
                </div>
            )}
        </div>
    );
};
