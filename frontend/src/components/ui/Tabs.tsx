/**
 * Tabs — reusable tab strip
 * Active tab uses primary (CIH Blue), NOT accent (orange).
 * Full dark mode.
 */
import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';

export interface TabItem {
    key: string;
    label: string;
    icon?: LucideIcon;
    visible?: boolean;
}

interface TabsProps {
    tabs: TabItem[];
    activeTab: string;
    onChange: (key: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
    const visibleTabs = tabs.filter(t => t.visible !== false);

    return (
        <div className="border-b border-slate-200 dark:border-slate-800">
            <nav className="-mb-px flex space-x-1 overflow-x-auto" role="tablist">
                {visibleTabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => onChange(tab.key)}
                            role="tab"
                            aria-selected={isActive}
                            className={clsx(
                                'whitespace-nowrap py-3 px-4 border-b-2 text-xs font-semibold uppercase tracking-wider flex items-center transition-none',
                                isActive
                                    ? 'border-primary text-primary dark:border-blue-400 dark:text-blue-400'
                                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                            )}
                        >
                            {Icon && <Icon className="h-4 w-4 mr-1.5" />}
                            {tab.label}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
