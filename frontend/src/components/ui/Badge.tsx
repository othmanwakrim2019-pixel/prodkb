/**
 * Badge — severity/status indicator
 * Replaces repeated inline badge styling across 5+ pages
 */
import clsx from 'clsx';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
    size?: 'sm' | 'md';
    className?: string;
}

const VARIANTS = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    neutral: 'bg-slate-200 text-slate-600',
};

const SIZES = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
};

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
    return (
        <span className={clsx(
            'inline-flex items-center font-medium rounded-full whitespace-nowrap',
            VARIANTS[variant],
            SIZES[size],
            className
        )}>
            {children}
        </span>
    );
}

// ── Convenience badges for common patterns ──

const SEVERITY_MAP: Record<string, BadgeProps['variant']> = {
    CRITICAL: 'danger',
    HIGH: 'warning',
    MEDIUM: 'info',
    LOW: 'neutral',
};

const STATUS_MAP: Record<string, BadgeProps['variant']> = {
    OPEN: 'danger',
    ACKNOWLEDGED: 'warning',
    INVESTIGATING: 'info',
    RESOLVED: 'success',
    CLOSED: 'neutral',
};

export function SeverityBadge({ severity }: { severity: string }) {
    return <Badge variant={SEVERITY_MAP[severity] || 'default'}>{severity}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
    return <Badge variant={STATUS_MAP[status] || 'default'}>{status}</Badge>;
}
