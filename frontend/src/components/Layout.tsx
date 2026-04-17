import { Outlet, Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Search } from 'lucide-react';
import clsx from 'clsx';
import { ChangePasswordModal } from '../features/auth/components/ChangePasswordModal';
import { UserProfileDropdown } from './UserProfileDropdown';
import { NotificationBell } from '../features/notifications/components/NotificationBell';
import { ThemeToggle } from './ThemeToggle';
import { CommandPalette } from './CommandPalette';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { CriticalIncidentBanner } from './CriticalIncidentBanner';
import { incidentService } from '../features/incidents/api/incident.service';
import {
    ADMIN_NAV_GROUPS,
    APP_PATHS,
    getAdminTabMeta,
    getPrimarySectionLabel,
    TOP_NAV_ITEMS,
} from '../app/route-meta';

interface NavChild {
    label: string;
    tab?: string;
    path?: string;
    icon: React.ElementType;
    permission?: string;
}

interface CollapsibleGroupProps {
    label: string;
    icon: React.ElementType;
    children: NavChild[];
    isOpen: boolean;
    onToggle: () => void;
    currentTab: string | null;
    currentPath: string;
    hasPermission: (perm: string) => boolean;
    onChildClick: (tab: string) => void;
    onNavigatePath: (path: string) => void;
}

const CollapsibleGroup = ({
    label,
    icon: Icon,
    children,
    isOpen,
    onToggle,
    currentTab,
    currentPath,
    hasPermission,
    onChildClick,
    onNavigatePath,
}: CollapsibleGroupProps) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        if (contentRef.current) {
            setHeight(isOpen ? contentRef.current.scrollHeight : 0);
        }
    }, [isOpen, children]);

    const visibleChildren = children.filter((child) => !child.permission || hasPermission(child.permission));
    if (visibleChildren.length === 0) return null;

    const isAnyChildActive = visibleChildren.some((child) =>
        child.path ? currentPath === child.path : currentPath === APP_PATHS.admin && child.tab === currentTab
    );

    return (
        <div>
            <button
                onClick={onToggle}
                className={clsx(
                    'w-full flex items-center px-4 py-2.5 text-sm font-medium rounded transition-none',
                    isAnyChildActive
                        ? 'bg-white/10 text-white'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                )}
            >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                <ChevronRight
                    className={clsx(
                        'h-4 w-4 transition-transform duration-200',
                        isOpen && 'rotate-90'
                    )}
                />
            </button>
            <div
                className="overflow-hidden transition-all duration-200 ease-in-out"
                style={{ height }}
            >
                <div ref={contentRef} className="pl-4 py-1 space-y-0.5">
                    {visibleChildren.map((child) => {
                        const ChildIcon = child.icon;
                        const isActive = child.path
                            ? currentPath === child.path
                            : currentPath === APP_PATHS.admin && currentTab === child.tab;

                        return (
                            <button
                                key={child.tab || child.path}
                                onClick={() => child.path ? onNavigatePath(child.path) : onChildClick(child.tab!)}
                                className={clsx(
                                    'w-full flex items-center px-4 py-2 text-xs font-medium rounded transition-none',
                                    isActive
                                        ? 'bg-white/15 text-white border-l-2 border-white/60 ml-0'
                                        : 'text-white/55 hover:bg-white/5 hover:text-white/90'
                                )}
                            >
                                <ChildIcon className="mr-2.5 h-3.5 w-3.5 flex-shrink-0" />
                                {child.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export const Layout = () => {
    const { user, logout, hasPermission } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const { t } = useTranslation();
    const currentTab = searchParams.get('tab');

    // ── Feature 4: Live browser tab badge showing active incident count ──
    useEffect(() => {
        let cancelled = false;
        const updateTitle = async () => {
            try {
                const result = await incidentService.getAll({ status: 'Open', limit: 1 });
                if (!cancelled) {
                    const section = getPrimarySectionLabel(location.pathname);
                    const sectionLabel = section ? t(section.labelKey, section.defaultLabel) : 'ProdKB';
                    const count = result.total ?? 0;
                    document.title = count > 0 ? `(${count}) ${sectionLabel} — ProdKB` : `${sectionLabel} — ProdKB`;
                }
            } catch {
                document.title = 'ProdKB';
            }
        };
        updateTitle();
        const interval = setInterval(updateTitle, 60_000);
        return () => { cancelled = true; clearInterval(interval); };
    }, [location.pathname, t]);

    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
        location.pathname === APP_PATHS.admin
            ? { settings: true, userMgmt: true }
            : {}
    );

    const toggleGroup = (key: string) => {
        setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleLogout = () => {
        logout();
        navigate(APP_PATHS.login);
    };

    const navigateToAdminTab = (tab: string) => {
        navigate(`${APP_PATHS.admin}?tab=${tab}`);
    };

    const visibleTopNav = TOP_NAV_ITEMS.filter((item) => hasPermission(item.permission));
    const isAdmin = user?.role === 'ADMIN';
    const checkPerm = (perm: string) => isAdmin || hasPermission(perm);

    const translatedAdminGroups = ADMIN_NAV_GROUPS.map((group) => ({
        ...group,
        label: t(group.labelKey, group.defaultLabel),
        children: group.children.map((child) => ({
            ...child,
            label: t(child.labelKey, child.defaultLabel),
        })),
    }));

    const visibleAdminGroups = translatedAdminGroups.filter(
        (group) => isAdmin || group.children.some((child) => hasPermission(child.permission))
    );

    const currentSection = getPrimarySectionLabel(location.pathname);
    const currentAdminTab = getAdminTabMeta(currentTab);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
            <aside className="w-64 bg-[#001a38] dark:bg-[#161a1d] text-slate-300 flex flex-col fixed h-full z-40 transition-transform duration-200 -translate-x-full md:translate-x-0 border-r border-slate-200 dark:border-slate-800" id="sidebar">
                <div className="p-4 border-b border-white/5 bg-black/10">
                    <img src="/logo.png" alt="CIH Bank" className="w-full max-h-12 object-contain" />
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
                    {visibleTopNav.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    'flex items-center px-4 py-2.5 text-sm font-medium rounded transition-none',
                                    isActive
                                        ? 'bg-primary dark:bg-slate-800 text-white border-l-[3px] border-accent font-semibold'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border-l-[3px] border-transparent'
                                )}
                            >
                                <Icon className="mr-3 h-5 w-5" />
                                {t(item.labelKey, item.defaultLabel)}
                            </Link>
                        );
                    })}

                    {visibleAdminGroups.length > 0 && (
                        <div className="pt-3 pb-2 px-4">
                            <div className="border-t border-white/10" />
                            <span className="block text-[10px] uppercase tracking-widest text-white/30 mt-3 mb-1 font-semibold">
                                Administration
                            </span>
                        </div>
                    )}

                    {visibleAdminGroups.map((group) => (
                        <CollapsibleGroup
                            key={group.key}
                            label={group.label}
                            icon={group.icon}
                            children={group.children as NavChild[]}
                            isOpen={openGroups[group.key] || false}
                            onToggle={() => toggleGroup(group.key)}
                            currentTab={currentTab}
                            currentPath={location.pathname}
                            hasPermission={checkPerm}
                            onChildClick={navigateToAdminTab}
                            onNavigatePath={navigate}
                        />
                    ))}
                </nav>

                <UserProfileDropdown
                    user={user}
                    onLogout={handleLogout}
                />
            </aside>

            <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
                <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                        <button
                            className="md:hidden p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                            onClick={() => {
                                const sidebar = document.getElementById('sidebar');
                                sidebar?.classList.toggle('-translate-x-full');
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        <span className="text-slate-400 dark:text-slate-500">ProdKB</span>
                        <span className="text-slate-300 dark:text-slate-600">/</span>
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                            {currentSection ? t(currentSection.labelKey, currentSection.defaultLabel) : ''}
                        </span>
                        {location.pathname === APP_PATHS.admin && currentTab && currentAdminTab && (
                            <>
                                <span className="text-slate-300 dark:text-slate-600">/</span>
                                <span className="text-slate-500 dark:text-slate-400">{t(currentAdminTab.labelKey, currentAdminTab.defaultLabel)}</span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Ctrl+K hint button */}
                        <button
                            onClick={() => { const e = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }); window.dispatchEvent(e); }}
                            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                            title="Open command palette (Ctrl+K)"
                        >
                            <Search className="h-3.5 w-3.5" />
                            <span>Search...</span>
                            <kbd className="ml-1 text-[10px] font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded">Ctrl K</kbd>
                        </button>
                        <ThemeToggle />
                        <NotificationBell />
                        <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">{t('common.online')}</span>
                        </div>
                    </div>
                </header>

                {/* Feature 2: Critical incident banner */}
                <CriticalIncidentBanner />

                <div className="flex-1 p-4 md:p-8">
                    <Outlet />
                </div>
            </main>

            <ChangePasswordModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
            />

            {/* Global command palette — mounted here so it's always available */}
            <CommandPalette />

            {/* Feature 3: Keyboard shortcuts modal — press ? */}
            <KeyboardShortcutsModal />
        </div>
    );
};
