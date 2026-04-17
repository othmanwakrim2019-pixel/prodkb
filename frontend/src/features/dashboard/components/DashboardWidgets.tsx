/**
 * Reusable dashboard UI components
 * Extracted from Dashboard.tsx for reusability and testability
 */
import { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

// ── Animated counter component ──
export const AnimatedNumber = ({ value, className }: { value: number; className?: string }) => {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        if (value === 0) { setDisplay(0); return; }
        const duration = 600;
        const steps = 20;
        const increment = value / steps;
        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
                setDisplay(value);
                clearInterval(timer);
            } else {
                setDisplay(Math.round(current));
            }
        }, duration / steps);
        return () => clearInterval(timer);
    }, [value]);
    return <span className={className}>{display}</span>;
};

// ── KPI Card component ──
export interface KPICardProps {
    title: string;
    value: number;
    subtitle: string;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    delay?: string;
    gradient?: string;
}

export const KPICard = ({ title, value, subtitle, icon, trend, delay, gradient }: KPICardProps) => (
    <div
        className={`bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600 p-4 transition-none group text-left ${gradient || ''}`}
        style={delay ? { animationDelay: delay } : undefined}
    >
        <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{title}</span>
            <div className="text-slate-400 dark:text-slate-500">
                {icon}
            </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
            <AnimatedNumber value={value} className="text-2xl font-bold text-slate-900 dark:text-slate-100" />
            {trend && trend !== 'neutral' && (
                <span className={`flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded ${trend === 'up' ? 'text-accent bg-accent/10' : 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20'}`}>
                    {trend === 'up'
                        ? <ArrowUpRight className="h-3 w-3 mr-0.5" />
                        : <ArrowDownRight className="h-3 w-3 mr-0.5" />
                    }
                </span>
            )}
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{subtitle}</p>
    </div>
);

export const PeriodPill = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1 text-xs font-semibold rounded border transition-none ${active
            ? 'bg-primary dark:bg-slate-700 text-white border-primary dark:border-slate-600'
            : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
    >
        {label}
    </button>
);
