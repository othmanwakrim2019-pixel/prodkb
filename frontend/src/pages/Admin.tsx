import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Database, UsersIcon, Clock, Shield, Activity, FileEdit, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RoleManager } from './RoleManager';
import AuditLogs from './AuditLogs';
import { Settings as SmtpSettings } from './admin/Settings';
import { EmailTemplates } from './admin/EmailTemplates';
import { UserManagement } from './admin/UserManagement';
import { SystemManagement } from './admin/SystemManagement';
import { TeamManagement } from './admin/TeamManagement';
import { SLAManagement } from './admin/SLAManagement';
import { Tabs, type TabItem } from '../components/ui/Tabs';
import { useTranslation } from 'react-i18next';

export const Admin = () => {
    const { user, hasPermission } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('users');
    const { t } = useTranslation();

    // Access control check
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

    const tabs: TabItem[] = [
        { key: 'users', label: t('admin.tabs.users'), icon: Users, visible: showUsers },
        { key: 'systems', label: t('admin.tabs.systems'), icon: Database, visible: showSystems },
        { key: 'teams', label: t('admin.tabs.teams'), icon: UsersIcon, visible: showTeams },
        { key: 'slas', label: t('admin.tabs.slas'), icon: Clock, visible: showSLAs },
        { key: 'roles', label: t('admin.tabs.roles'), icon: Shield, visible: showRoles },
        { key: 'audit', label: t('admin.tabs.auditLogs'), icon: Activity, visible: showAudit },
        { key: 'email-templates', label: t('admin.tabs.emailTemplates'), icon: FileEdit, visible: hasPermission('SYSTEM_MANAGE') },
        { key: 'settings', label: 'SMTP', icon: Settings, visible: hasPermission('SYSTEM_MANAGE') },
    ];

    // Auto-select first visible tab if current is not accessible
    useEffect(() => {
        const visibleTabs = tabs.filter(tab => tab.visible !== false);
        const isAccessible = visibleTabs.some(tab => tab.key === activeTab);
        if (!isAccessible && visibleTabs.length > 0) {
            setActiveTab(visibleTabs[0].key);
        }
    }, [showUsers, showSystems, showTeams, showSLAs, showRoles, showAudit, activeTab]);

    const visibleTabs = tabs.filter(tab => tab.visible !== false);
    if (visibleTabs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="bg-red-50 p-6 rounded-full mb-4">
                    <Shield className="h-12 w-12 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{t('common.accessDenied')}</h2>
                <p className="text-slate-600 mt-2 max-w-md">
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
        'roles': <RoleManager />,
        'audit': <AuditLogs />,
        'email-templates': <EmailTemplates />,
        'settings': <SmtpSettings />,
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">{t('admin.title')}</h1>
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
            <div className="py-4">
                {TAB_PANELS[activeTab]}
            </div>
        </div>
    );
};

export default Admin;
