/**
 * Reusable Pagination Component
 * Provides page navigation, rows-per-page selector, and result count display.
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

    // Generate visible page numbers (show max 5 pages)
    const getPages = (): (number | '...')[] => {
        if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const pages: (number | '...')[] = [1];
        const start = Math.max(2, page - 1);
        const end = Math.min(totalPages - 1, page + 1);
        if (start > 2) pages.push('...');
        for (let i = start; i <= end; i++) pages.push(i);
        if (end < totalPages - 1) pages.push('...');
        pages.push(totalPages);
        return pages;
    };

    if (total === 0) return null;

    return (
        <div className={clsx('flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50/50', className)}>
            {/* Left: result count & rows per page */}
            <div className="flex items-center gap-4 text-sm text-slate-600">
                <span>
                    Showing <span className="font-semibold text-slate-800">{from}</span> –{' '}
                    <span className="font-semibold text-slate-800">{to}</span> of{' '}
                    <span className="font-semibold text-slate-800">{total}</span>
                </span>
                {onLimitChange && (
                    <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Rows:</span>
                        <select
                            value={limit}
                            onChange={(e) => onLimitChange(Number(e.target.value))}
                            className="rounded-md border border-slate-300 bg-white py-1 pl-2 pr-6 text-xs font-medium text-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            {limitOptions.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Right: page buttons */}
            <nav className="flex items-center gap-1" aria-label="Pagination">
                {/* First */}
                <button
                    onClick={() => onPageChange(1)}
                    disabled={page === 1}
                    className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="First page"
                >
                    <ChevronsLeft className="h-4 w-4" />
                </button>
                {/* Prev */}
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1}
                    className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Previous page"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Page numbers */}
                {getPages().map((p, i) =>
                    p === '...' ? (
                        <span key={`dots-${i}`} className="px-1 text-slate-400 text-xs">…</span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            className={clsx(
                                'min-w-[32px] h-8 rounded-md text-xs font-semibold transition-all',
                                p === page
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            )}
                        >
                            {p}
                        </button>
                    )
                )}

                {/* Next */}
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Next page"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
                {/* Last */}
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Last page"
                >
                    <ChevronsRight className="h-4 w-4" />
                </button>
            </nav>
        </div>
    );
};
