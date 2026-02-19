/**
 * Tabs — reusable tab component
 * Replaces 100+ lines of duplicated tab styling in Admin.tsx
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
        <div className="border-b border-slate-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto" role="tablist">
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
                                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors',
                                isActive
                                    ? 'border-accent text-accent'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            )}
                        >
                            {Icon && <Icon className="h-5 w-5 mr-2" />}
                            {tab.label}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
