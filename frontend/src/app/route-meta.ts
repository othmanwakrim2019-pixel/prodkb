import type { ElementType } from 'react';
import {
    Activity,
    ActivitySquare,
    AlertCircle,
    AlertTriangle,
    BookOpen,
    CalendarClock,
    ClipboardList,
    Clock,
    Database,
    FileEdit,
    GitBranch,
    Globe,
    LayoutDashboard,
    Mail,
    Search,
    Settings as SettingsIcon,
    Shield,
    ShieldCheck,
    Users,
    Users2,
    UsersIcon,
    Wrench,
} from 'lucide-react';

export const APP_PATHS = {
    login: '/login',
    home: '/',
    incidents: '/incidents',
    incidentNew: '/incidents/new',
    incidentLegacyCreate: '/incidents/create',
    procedures: '/procedures',
    procedureNew: '/procedures/new',
    search: '/search',
    admin: '/admin',
    planning: '/planning',
    status: '/status',
    adminMaintenance: '/admin/maintenance',
    equipe: '/equipe',
    mesTaches: '/mes-taches',
    forbidden: '/403',
} as const;

export interface NavItem {
    labelKey: string;
    defaultLabel: string;
    path: string;
    icon: ElementType;
    permission: string;
}

export interface AdminNavChild {
    labelKey: string;
    defaultLabel: string;
    icon: ElementType;
    permission: string;
    tab?: string;
    path?: string;
}

export interface AdminNavGroup {
    key: string;
    labelKey: string;
    defaultLabel: string;
    icon: ElementType;
    children: AdminNavChild[];
}

export const TOP_NAV_ITEMS: NavItem[] = [
    { labelKey: 'nav.dashboard',  defaultLabel: 'Dashboard',     path: APP_PATHS.home,       icon: LayoutDashboard, permission: 'DASHBOARD_VIEW' },
    { labelKey: 'nav.incidents',  defaultLabel: 'Incidents',     path: APP_PATHS.incidents,  icon: AlertCircle,     permission: 'INCIDENT_VIEW' },
    { labelKey: 'nav.procedures', defaultLabel: 'Procedures',    path: APP_PATHS.procedures, icon: BookOpen,        permission: 'PROCEDURE_VIEW' },
    { labelKey: 'nav.search',     defaultLabel: 'Search',        path: APP_PATHS.search,     icon: Search,          permission: 'SEARCH_VIEW' },
    { labelKey: 'nav.planning',   defaultLabel: 'Planning',      path: APP_PATHS.planning,   icon: CalendarClock,   permission: 'PLANNING_VIEW' },
    { labelKey: 'nav.equipe',     defaultLabel: 'Équipe',        path: APP_PATHS.equipe,     icon: Users2,          permission: 'EQUIPE_VIEW' },
    { labelKey: 'nav.mesTaches',  defaultLabel: 'Mes Tâches',    path: APP_PATHS.mesTaches,  icon: ClipboardList,   permission: 'EQUIPE_VIEW' },
    { labelKey: 'nav.status',     defaultLabel: 'Public Status', path: APP_PATHS.status,     icon: ActivitySquare,  permission: 'DASHBOARD_VIEW' },
];

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
    {
        key: 'settings',
        labelKey: 'nav.settings',
        defaultLabel: 'Settings',
        icon: SettingsIcon,
        children: [
            { labelKey: 'admin.tabs.systems', defaultLabel: 'Applications', tab: 'systems', icon: Database, permission: 'SYSTEM_MANAGE' },
            { labelKey: 'admin.tabs.maintenance', defaultLabel: 'Maintenance Windows', path: APP_PATHS.adminMaintenance, icon: Wrench, permission: 'SYSTEM_MANAGE' },
            { labelKey: 'admin.tabs.teams', defaultLabel: 'Teams', tab: 'teams', icon: UsersIcon, permission: 'TEAM_MANAGE' },
            { labelKey: 'admin.tabs.slas', defaultLabel: 'SLAs', tab: 'slas', icon: Clock, permission: 'SLA_MANAGE' },
            { labelKey: 'admin.tabs.escalation', defaultLabel: 'Escalation', tab: 'escalation', icon: AlertTriangle, permission: 'ESCALATION_MANAGE' },
            { labelKey: 'admin.tabs.autoAssign', defaultLabel: 'Auto-Assign', tab: 'auto-assign', icon: GitBranch, permission: 'AUTO_ASSIGN_MANAGE' },
            { labelKey: 'admin.tabs.webhooks', defaultLabel: 'Webhooks', tab: 'webhooks', icon: Globe, permission: 'WEBHOOK_MANAGE' },
            { labelKey: 'admin.tabs.emailTemplates', defaultLabel: 'Email Templates', tab: 'email-templates', icon: FileEdit, permission: 'EMAIL_TEMPLATE_MANAGE' },
            { labelKey: 'admin.tabs.smtp', defaultLabel: 'SMTP', tab: 'settings', icon: Mail, permission: 'CONFIG_MANAGE' },
        ],
    },
    {
        key: 'userMgmt',
        labelKey: 'nav.userManagement',
        defaultLabel: 'User Management',
        icon: Users,
        children: [
            { labelKey: 'admin.tabs.users', defaultLabel: 'Users', tab: 'users', icon: Users, permission: 'USER_MANAGE' },
            { labelKey: 'admin.tabs.roles', defaultLabel: 'Roles & Permissions', tab: 'roles', icon: Shield, permission: 'ROLE_MANAGE' },
        ],
    },
    {
        key: 'monitoring',
        labelKey: 'nav.monitoring',
        defaultLabel: 'Monitoring',
        icon: Activity,
        children: [
            { labelKey: 'admin.tabs.health', defaultLabel: 'Service Health', tab: 'health', icon: Activity, permission: 'DASHBOARD_VIEW' },
            { labelKey: 'admin.tabs.auditConfig', defaultLabel: 'Audit Config', tab: 'audit-config', icon: ShieldCheck, permission: 'CONFIG_MANAGE' },
            { labelKey: 'admin.tabs.auditLogs', defaultLabel: 'Audit Logs', tab: 'audit', icon: Activity, permission: 'AUDIT_VIEW' },
        ],
    },
];

export const ADMIN_TAB_ITEMS = ADMIN_NAV_GROUPS.flatMap((group) =>
    group.children.filter((child): child is AdminNavChild & { tab: string } => typeof child.tab === 'string')
);

export const ADMIN_TAB_PERMISSIONS = Object.fromEntries(
    ADMIN_TAB_ITEMS.map((item) => [item.tab, item.permission])
) as Record<string, string>;

export const ADMIN_TAB_ORDER = ADMIN_TAB_ITEMS.map((item) => item.tab);

export const getAdminTabPath = (tab: string) => `${APP_PATHS.admin}?tab=${tab}`;

export const getFirstAccessibleAdminTab = (hasPermission: (permission: string) => boolean) =>
    ADMIN_TAB_ORDER.find((tab) => hasPermission(ADMIN_TAB_PERMISSIONS[tab])) || null;

export const getFirstAccessiblePath = (hasPermission: (permission: string) => boolean) => {
    const firstTopNav = TOP_NAV_ITEMS.find((item) => hasPermission(item.permission));
    if (firstTopNav) {
        return firstTopNav.path;
    }

    const firstAdminTab = getFirstAccessibleAdminTab(hasPermission);
    if (firstAdminTab) {
        return getAdminTabPath(firstAdminTab);
    }

    return null;
};

export const getPrimarySectionLabel = (pathname: string) => {
    if (pathname === APP_PATHS.home) return { labelKey: 'nav.dashboard', defaultLabel: 'Dashboard' };
    if (pathname.startsWith(APP_PATHS.incidents)) return { labelKey: 'nav.incidents', defaultLabel: 'Incidents' };
    if (pathname.startsWith(APP_PATHS.procedures)) return { labelKey: 'nav.procedures', defaultLabel: 'Procedures' };
    if (pathname === APP_PATHS.search) return { labelKey: 'nav.search', defaultLabel: 'Search' };
    if (pathname === APP_PATHS.planning) return { labelKey: 'nav.planning', defaultLabel: 'Planning' };
    if (pathname === APP_PATHS.admin) return { labelKey: 'common.administration', defaultLabel: 'Administration' };
    if (pathname === APP_PATHS.status) return { labelKey: 'nav.status', defaultLabel: 'Public Status' };
    if (pathname === APP_PATHS.adminMaintenance) return { labelKey: 'admin.tabs.maintenance', defaultLabel: 'Maintenance Windows' };
    return null;
};

export const getAdminTabMeta = (tab: string | null) =>
    ADMIN_TAB_ITEMS.find((item) => item.tab === tab) || null;
