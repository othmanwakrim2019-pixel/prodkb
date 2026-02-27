import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Database, UsersIcon, Clock, Shield, Activity, FileEdit, Settings, AlertTriangle, GitBranch, Globe, ClipboardList } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RoleManager } from './RoleManager';
import AuditLogs from './AuditLogs';
import { Settings as SmtpSettings } from './admin/Settings';
import { AuditConfig } from './admin/AuditConfig';
import { EmailTemplates } from './admin/EmailTemplates';
import { UserManagement } from './admin/UserManagement';
import { SystemManagement } from './admin/SystemManagement';
import { TeamManagement } from './admin/TeamManagement';
import { SLAManagement } from './admin/SLAManagement';
import { EscalationManagement } from './admin/EscalationManagement';
import { AutoAssignManagement } from './admin/AutoAssignManagement';
import { WebhookManagement } from './admin/WebhookManagement';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';

interface AdminTab {
    key: string;
    label: string;
    icon: LucideIcon;
    visible: boolean;
    separator?: boolean; // visual group separator before this tab
}

export const Admin = () => {
    const { user, hasPermission } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const urlTab = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState(urlTab || 'users');
    const { t } = useTranslation();

    useEffect(() => {
        if (urlTab && urlTab !== activeTab) {
            setActiveTab(urlTab);
        }
    }, [urlTab]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    useEffect(() => {
        if (!user) navigate('/');
    }, [user, navigate]);

    // Permission checks
    const showUsers = hasPermission('USER_MANAGE');
    const showSystems = hasPermission('SYSTEM_MANAGE');
    const showTeams = hasPermission('TEAM_MANAGE') || user?.role === 'ADMIN';
    const showSLAs = hasPermission('SLA_MANAGE') || user?.role === 'ADMIN';
    const showRoles = hasPermission('ROLE_MANAGE');
    const showAudit = hasPermission('AUDIT_VIEW');
    const showEscalation = hasPermission('ESCALATION_MANAGE') || user?.role === 'ADMIN';
    const showAutoAssign = hasPermission('AUTO_ASSIGN_MANAGE') || user?.role === 'ADMIN';
    const showWebhooks = hasPermission('WEBHOOK_MANAGE') || user?.role === 'ADMIN';
    const showEmailTemplates = hasPermission('EMAIL_TEMPLATE_MANAGE') || user?.role === 'ADMIN';
    const showConfig = hasPermission('CONFIG_MANAGE') || user?.role === 'ADMIN';

    // Tabs with separators to create visual groups
    const tabs: AdminTab[] = [
        // ── User Management ──
        { key: 'users', label: t('admin.tabs.users'), icon: Users, visible: showUsers },
        { key: 'roles', label: t('admin.tabs.roles'), icon: Shield, visible: showRoles },

        // ── System Configuration ──
        { key: 'systems', label: t('admin.tabs.systems'), icon: Database, visible: showSystems, separator: true },
        { key: 'teams', label: t('admin.tabs.teams'), icon: UsersIcon, visible: showTeams },
        { key: 'slas', label: t('admin.tabs.slas'), icon: Clock, visible: showSLAs },

        // ── Automation ──
        { key: 'escalation', label: t('admin.tabs.escalation', 'Escalation'), icon: AlertTriangle, visible: showEscalation, separator: true },
        { key: 'auto-assign', label: t('admin.tabs.autoAssign', 'Auto-Assign'), icon: GitBranch, visible: showAutoAssign },
        { key: 'webhooks', label: t('admin.tabs.webhooks', 'Webhooks'), icon: Globe, visible: showWebhooks },

        // ── Communication ──
        { key: 'email-templates', label: t('admin.tabs.emailTemplates'), icon: FileEdit, visible: showEmailTemplates, separator: true },
        { key: 'settings', label: 'SMTP', icon: Settings, visible: showConfig },

        // ── Monitoring ──
        { key: 'audit-config', label: t('admin.tabs.auditConfig', 'Audit Config'), icon: ClipboardList, visible: showConfig, separator: true },
        { key: 'audit', label: t('admin.tabs.auditLogs'), icon: Activity, visible: showAudit },
    ];

    const visibleTabs = tabs.filter(tab => tab.visible);

    // Auto-select first visible tab if current is not accessible
    useEffect(() => {
        const isAccessible = visibleTabs.some(tab => tab.key === activeTab);
        if (!isAccessible && visibleTabs.length > 0) {
            setActiveTab(visibleTabs[0].key);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showUsers, showSystems, showTeams, showSLAs, showRoles, showAudit, showEscalation, showAutoAssign, showWebhooks, activeTab]);

    if (visibleTabs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="bg-red-50 p-6 rounded-full mb-4">
                    <Shield className="h-12 w-12 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('common.accessDenied')}</h2>
                <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-md">
                    {t('common.accessDeniedMessage')}
                </p>
            </div>
        );
    }

    const TAB_PANELS: Record<string, React.ReactNode> = {
        'users': <UserManagement />,
        'systems': <SystemManagement />,
        'teams': <TeamManagement />,
        'slas': <SLAManagement />,
        'escalation': <EscalationManagement />,
        'auto-assign': <AutoAssignManagement />,
        'webhooks': <WebhookManagement />,
        'roles': <RoleManager />,
        'audit': <AuditLogs />,
        'audit-config': <AuditConfig />,
        'email-templates': <EmailTemplates />,
        'settings': <SmtpSettings />,
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('admin.title')}</h1>

            {/* Grouped horizontal tabs with separators */}
            <div className="border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex flex-wrap gap-y-1" role="tablist">
                    {visibleTabs.map((tab, idx) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        // Show separator if tab has separator flag and it's not the first visible tab
                        const showSep = tab.separator && idx > 0;
                        return (
                            <div key={tab.key} className="flex items-center">
                                {showSep && (
                                    <div className="h-6 w-px bg-slate-300 dark:bg-slate-600 mx-3" />
                                )}
                                <button
                                    onClick={() => handleTabChange(tab.key)}
                                    role="tab"
                                    aria-selected={isActive}
                                    className={clsx(
                                        'whitespace-nowrap py-3 px-3 border-b-2 font-medium text-sm flex items-center transition-colors',
                                        isActive
                                            ? 'border-accent text-accent'
                                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300'
                                    )}
                                >
                                    <Icon className="h-4 w-4 mr-1.5" />
                                    {tab.label}
                                </button>
                            </div>
                        );
                    })}
                </nav>
            </div>

            {/* Tab content */}
            <div>
                {TAB_PANELS[activeTab]}
            </div>
        </div>
    );
};

export default Admin;
