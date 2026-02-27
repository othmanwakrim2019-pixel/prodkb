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
    gradient: string;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    delay?: string;
}

export const KPICard = ({ title, value, subtitle, gradient, icon, trend, delay }: KPICardProps) => (
    <div
        className={`${gradient} rounded-2xl p-5 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-default animate-fade-up relative overflow-hidden group`}
        style={{ animationDelay: delay }}
    >
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-white/5" />

        <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium uppercase tracking-wider text-white/80">{title}</span>
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                    {icon}
                </div>
            </div>
            <div className="flex items-end gap-2">
                <AnimatedNumber value={value} className="text-3xl font-bold" />
                {trend && trend !== 'neutral' && (
                    <span className="flex items-center text-xs font-medium text-white/80 mb-1">
                        {trend === 'up'
                            ? <ArrowUpRight className="h-3.5 w-3.5" />
                            : <ArrowDownRight className="h-3.5 w-3.5" />
                        }
                    </span>
                )}
            </div>
            <p className="text-xs text-white/65 mt-1">{subtitle}</p>
        </div>
    </div>
);

// ── Period Pill Button ──
export const PeriodPill = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${active
            ? 'bg-primary text-white shadow-md shadow-primary/25'
            : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-slate-200'
            }`}
    >
        {label}
    </button>
);
