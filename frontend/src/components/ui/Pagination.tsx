/**
 * Reusable Pagination Component
 * Flat enterprise style — no shadow-sm, no rounded-md.
 * Full dark mode. Integrated into table card (no separate wrapper needed).
 */
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import clsx from 'clsx';

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface PaginationProps {
    meta: PaginationMeta;
    onPageChange: (page: number) => void;
    onLimitChange?: (limit: number) => void;
    limitOptions?: number[];
    className?: string;
}

export const Pagination = ({
    meta,
    onPageChange,
    onLimitChange,
    limitOptions = [10, 20, 50],
    className,
}: PaginationProps) => {
    const { page, totalPages, total, limit } = meta;
    const from = total > 0 ? (page - 1) * limit + 1 : 0;
    const to = Math.min(page * limit, total);

    const getPages = (): (number | '...')[] => {
        if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const pages: (number | '...')[] = [1];
        const start = Math.max(2, page - 1);
        const end   = Math.min(totalPages - 1, page + 1);
        if (start > 2) pages.push('...');
        for (let i = start; i <= end; i++) pages.push(i);
        if (end < totalPages - 1) pages.push('...');
        pages.push(totalPages);
        return pages;
    };

    if (total === 0) return null;

    const navBtn = 'p-1.5 rounded text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors';

    return (
        <div className={clsx(
            'flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50',
            className
        )}>
            {/* Left: count + rows-per-page */}
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span>
                    Showing{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{from}</span>
                    {' '}–{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{to}</span>
                    {' '}of{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{total}</span>
                </span>
                {onLimitChange && (
                    <div className="flex items-center gap-1.5">
                        <span>Rows:</span>
                        <select
                            value={limit}
                            onChange={(e) => onLimitChange(Number(e.target.value))}
                            className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-200 py-0.5 pl-1.5 pr-5 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            {limitOptions.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Right: page buttons */}
            <nav className="flex items-center gap-0.5" aria-label="Pagination">
                <button onClick={() => onPageChange(1)}           disabled={page === 1}          className={navBtn} title="First page"><ChevronsLeft  className="h-4 w-4" /></button>
                <button onClick={() => onPageChange(page - 1)}    disabled={page === 1}          className={navBtn} title="Previous page"><ChevronLeft  className="h-4 w-4" /></button>

                {getPages().map((p, i) =>
                    p === '...' ? (
                        <span key={`dots-${i}`} className="px-1 text-slate-400 text-xs">…</span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            className={clsx(
                                'min-w-[28px] h-7 rounded text-xs font-semibold transition-none',
                                p === page
                                    ? 'bg-primary text-white'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                            )}
                        >
                            {p}
                        </button>
                    )
                )}

                <button onClick={() => onPageChange(page + 1)}    disabled={page === totalPages} className={navBtn} title="Next page"><ChevronRight  className="h-4 w-4" /></button>
                <button onClick={() => onPageChange(totalPages)}   disabled={page === totalPages} className={navBtn} title="Last page"><ChevronsRight className="h-4 w-4" /></button>
            </nav>
        </div>
    );
};
