/**
 * Badge / Lozenge — severity & status indicators
 * Unified flat Jira-style lozenges. Use SeverityBadge / StatusBadge
 * convenience components or the raw Badge for custom variants.
 */
import clsx from 'clsx';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
    size?: 'sm' | 'md';
    className?: string;
}

const VARIANTS: Record<NonNullable<BadgeProps['variant']>, string> = {
    default: 'bg-slate-500 text-white dark:bg-slate-600',
    success: 'bg-emerald-600 text-white dark:bg-emerald-700',
    warning: 'bg-orange-500 text-white dark:bg-orange-600',
    danger:  'bg-red-600   text-white dark:bg-red-700',
    info:    'bg-blue-600  text-white dark:bg-blue-700',
    neutral: 'bg-slate-400 text-white dark:bg-slate-500',
};

const SIZES: Record<NonNullable<BadgeProps['size']>, string> = {
    sm: 'px-1.5 py-0.5 text-[11px]',
    md: 'px-2    py-0.5 text-xs',
};

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
    return (
        <span className={clsx(
            'ent-lozenge',
            VARIANTS[variant],
            SIZES[size],
            className
        )}>
            {children}
        </span>
    );
}

// ── Convenience badges ──

const SEVERITY_MAP: Record<string, BadgeProps['variant']> = {
    CRITICAL: 'danger',
    HIGH:     'warning',
    MEDIUM:   'info',
    LOW:      'neutral',
    Critical: 'danger',
    High:     'warning',
    Medium:   'info',
    Low:      'neutral',
};

const STATUS_MAP: Record<string, BadgeProps['variant']> = {
    OPEN:          'danger',
    ACKNOWLEDGED:  'warning',
    INVESTIGATING: 'info',
    RESOLVED:      'success',
    CLOSED:        'neutral',
    Open:          'danger',
    'In Progress': 'warning',
    Resolved:      'success',
    Closed:        'neutral',
};

export function SeverityBadge({ severity }: { severity: string }) {
    return <Badge variant={SEVERITY_MAP[severity] ?? 'default'}>{severity}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
    return <Badge variant={STATUS_MAP[status] ?? 'default'}>{status}</Badge>;
}
