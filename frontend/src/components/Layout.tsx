import { Outlet, Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    LayoutDashboard,
    Settings as SettingsIcon,
    AlertCircle,
    BookOpen,
    Search,
    CalendarClock,
    Users,
    Shield,
    Activity,
    ChevronRight,
    Database,
    UsersIcon,
    Clock,
    AlertTriangle,
    GitBranch,
    Globe,
    FileEdit,
    Mail,
    ShieldCheck
} from 'lucide-react';
import clsx from 'clsx';
import { ChangePasswordModal } from './ChangePasswordModal';
import { UserProfileDropdown } from './UserProfileDropdown';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from './ThemeToggle';

// ── Collapsible group for sidebar sub-navigation ──
interface NavChild {
    label: string;
    tab: string;
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
}

const CollapsibleGroup = ({
    label, icon: Icon, children, isOpen, onToggle,
    currentTab, currentPath, hasPermission, onChildClick
}: CollapsibleGroupProps) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        if (contentRef.current) {
            setHeight(isOpen ? contentRef.current.scrollHeight : 0);
        }
    }, [isOpen, children]);

    const visibleChildren = children.filter(
        c => !c.permission || hasPermission(c.permission)
    );
    if (visibleChildren.length === 0) return null;

    const isAnyChildActive = currentPath === '/admin' &&
        visibleChildren.some(c => c.tab === currentTab);

    return (
        <div>
            <button
                onClick={onToggle}
                className={clsx(
                    'w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-all duration-200',
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
                    {visibleChildren.map(child => {
                        const ChildIcon = child.icon;
                        const isActive = currentPath === '/admin' && currentTab === child.tab;
                        return (
                            <button
                                key={child.tab}
                                onClick={() => onChildClick(child.tab)}
                                className={clsx(
                                    'w-full flex items-center px-4 py-2 text-xs font-medium rounded-md transition-all duration-150',
                                    isActive
                                        ? 'bg-white/15 text-white border-l-2 border-white ml-0'
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

// ── Main Layout ──
export const Layout = () => {
    const { user, logout, hasPermission } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const { t } = useTranslation();
    const currentTab = searchParams.get('tab');

    // Track which sidebar groups are open
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
        location.pathname === '/admin'
            ? { settings: true, userMgmt: true }
            : {}
    );

    const toggleGroup = (key: string) => {
        setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navigateToAdminTab = (tab: string) => {
        navigate(`/admin?tab=${tab}`);
    };

    // Top-level nav items (no children)
    const topNavItems = [
        {
            label: t('nav.dashboard'),
            path: '/',
            icon: LayoutDashboard,
            requiredPermission: 'DASHBOARD_VIEW'
        },
        {
            label: t('nav.incidents'),
            path: '/incidents',
            icon: AlertCircle,
            requiredPermission: 'INCIDENT_VIEW'
        },
        {
            label: t('nav.procedures'),
            path: '/procedures',
            icon: BookOpen,
            requiredPermission: 'PROCEDURE_VIEW'
        },
        {
            label: t('nav.search'),
            path: '/search',
            icon: Search,
            requiredPermission: 'SEARCH_VIEW'
        },
        {
            label: t('nav.planning'),
            path: '/planning',
            icon: CalendarClock,
            requiredPermission: 'PLANNING_VIEW'
        },
        {
            label: 'Service Health',
            path: '/health',
            icon: Activity,
            requiredPermission: 'DASHBOARD_VIEW'
        },
    ];

    const visibleTopNav = topNavItems.filter(item => hasPermission(item.requiredPermission));

    // Settings sub-items
    const settingsChildren: NavChild[] = [
        { label: t('admin.tabs.systems', 'Applications'), tab: 'systems', icon: Database, permission: 'SYSTEM_MANAGE' },
        { label: t('admin.tabs.teams', 'Teams'), tab: 'teams', icon: UsersIcon, permission: 'TEAM_MANAGE' },
        { label: t('admin.tabs.slas', 'SLAs'), tab: 'slas', icon: Clock, permission: 'SLA_MANAGE' },
        { label: 'Escalation', tab: 'escalation', icon: AlertTriangle, permission: 'ESCALATION_MANAGE' },
        { label: 'Auto-Assign', tab: 'auto-assign', icon: GitBranch, permission: 'AUTO_ASSIGN_MANAGE' },
        { label: 'Webhooks', tab: 'webhooks', icon: Globe, permission: 'WEBHOOK_MANAGE' },
        { label: t('admin.tabs.emailTemplates', 'Email Templates'), tab: 'email-templates', icon: FileEdit, permission: 'EMAIL_TEMPLATE_MANAGE' },
        { label: 'SMTP', tab: 'settings', icon: Mail, permission: 'CONFIG_MANAGE' },
    ];

    // User Management sub-items
    const userMgmtChildren: NavChild[] = [
        { label: t('admin.tabs.users', 'Users'), tab: 'users', icon: Users, permission: 'USER_MANAGE' },
        { label: t('admin.tabs.roles', 'Roles & Permissions'), tab: 'roles', icon: Shield, permission: 'ROLE_MANAGE' },
    ];

    const isAdmin = user?.role === 'ADMIN';
    const showSettingsGroup = isAdmin || settingsChildren.some(c => c.permission && hasPermission(c.permission));
    const showUserMgmtGroup = isAdmin || userMgmtChildren.some(c => c.permission && hasPermission(c.permission));
    const showAudit = hasPermission('AUDIT_VIEW');

    // Permission helper that also accounts for ADMIN role
    const checkPerm = (perm: string) => isAdmin || hasPermission(perm);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-primary dark:bg-slate-800 text-white flex flex-col fixed h-full z-30 transition-transform duration-200 -translate-x-full md:translate-x-0" id="sidebar">
                <div className="p-6 border-b border-white/10">
                    <img src="/logo.png" alt="CIH Bank" className="w-full max-h-20 object-contain" />
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
                    {/* Top-level nav items */}
                    {visibleTopNav.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    'flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors',
                                    isActive
                                        ? 'bg-white/10 text-white border-l-4 border-white'
                                        : 'text-white/70 hover:bg-white/5 hover:text-white border-l-4 border-transparent'
                                )}
                            >
                                <Icon className="mr-3 h-5 w-5" />
                                {item.label}
                            </Link>
                        );
                    })}

                    {/* Divider before admin section */}
                    {(showSettingsGroup || showUserMgmtGroup || showAudit) && (
                        <div className="pt-3 pb-2 px-4">
                            <div className="border-t border-white/10" />
                            <span className="block text-[10px] uppercase tracking-widest text-white/30 mt-3 mb-1 font-semibold">
                                Administration
                            </span>
                        </div>
                    )}

                    {/* Settings group */}
                    {showSettingsGroup && (
                        <CollapsibleGroup
                            label={t('nav.settings', 'Settings')}
                            icon={SettingsIcon}
                            children={settingsChildren}
                            isOpen={openGroups.settings || false}
                            onToggle={() => toggleGroup('settings')}
                            currentTab={currentTab}
                            currentPath={location.pathname}
                            hasPermission={checkPerm}
                            onChildClick={navigateToAdminTab}
                        />
                    )}

                    {/* User Management group */}
                    {showUserMgmtGroup && (
                        <CollapsibleGroup
                            label={t('nav.userManagement', 'User Management')}
                            icon={Users}
                            children={userMgmtChildren}
                            isOpen={openGroups.userMgmt || false}
                            onToggle={() => toggleGroup('userMgmt')}
                            currentTab={currentTab}
                            currentPath={location.pathname}
                            hasPermission={checkPerm}
                            onChildClick={navigateToAdminTab}
                        />
                    )}

                    {/* Monitoring group — Audit Config + Audit Logs */}
                    {showAudit && (
                        <CollapsibleGroup
                            label={t('nav.monitoring', 'Monitoring')}
                            icon={Activity}
                            children={[
                                { label: t('admin.tabs.auditConfig', 'Audit Config'), tab: 'audit-config', icon: ShieldCheck, permission: 'CONFIG_MANAGE' },
                                { label: t('admin.tabs.auditLogs', 'Audit Logs'), tab: 'audit', icon: Activity, permission: 'AUDIT_VIEW' },
                            ]}
                            isOpen={openGroups.monitoring || false}
                            onToggle={() => toggleGroup('monitoring')}
                            currentTab={currentTab}
                            currentPath={location.pathname}
                            hasPermission={checkPerm}
                            onChildClick={navigateToAdminTab}
                        />
                    )}
                </nav>

                {/* User Profile Dropdown */}
                <UserProfileDropdown
                    user={user}
                    onChangePassword={() => setShowPasswordModal(true)}
                    onLogout={handleLogout}
                />
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
                {/* Top Header Bar */}
                <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-700/60 px-4 md:px-8 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                        {/* Mobile hamburger */}
                        <button
                            className="md:hidden p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                            onClick={() => {
                                const sb = document.getElementById('sidebar');
                                sb?.classList.toggle('-translate-x-full');
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        <span className="text-slate-400 dark:text-slate-500">ProdKB</span>
                        <span className="text-slate-300 dark:text-slate-600">/</span>
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                            {location.pathname === '/' && t('nav.dashboard')}
                            {location.pathname.startsWith('/incidents') && t('nav.incidents')}
                            {location.pathname.startsWith('/procedures') && t('nav.procedures')}
                            {location.pathname === '/search' && t('nav.search')}
                            {location.pathname === '/planning' && t('nav.planning')}
                            {location.pathname === '/admin' && t('common.administration')}
                        </span>
                        {location.pathname === '/admin' && currentTab && (
                            <>
                                <span className="text-slate-300 dark:text-slate-600">/</span>
                                <span className="text-slate-500 dark:text-slate-400 capitalize">{currentTab.replace('-', ' ')}</span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
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

                {/* Page Content */}
                <div className="flex-1 p-4 md:p-8">
                    <Outlet />
                </div>
            </main>

            {/* Password Change Modal */}
            <ChangePasswordModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
            />
        </div>
    );
};
