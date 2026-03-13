import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Shield } from 'lucide-react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { RoleManagerPage } from './RoleManagerPage';
import { AuditLogsPage } from './AuditLogsPage';
import { SettingsPage as SmtpSettings } from './SettingsPage';
import { AuditConfigPage as AuditConfig } from './AuditConfigPage';
import { HealthDashboardPage } from './HealthDashboardPage';
import { EmailTemplatesPage as EmailTemplates } from './EmailTemplatesPage';
import { UserManagementPage as UserManagement } from './UserManagementPage';
import { SystemManagementPage as SystemManagement } from './SystemManagementPage';
import { TeamManagementPage as TeamManagement } from './TeamManagementPage';
import { SLAManagementPage as SLAManagement } from './SLAManagementPage';
import { EscalationManagementPage as EscalationManagement } from './EscalationManagementPage';
import { AutoAssignManagementPage as AutoAssignManagement } from './AutoAssignManagementPage';
import { WebhookManagementPage as WebhookManagement } from './WebhookManagementPage';
import { useTranslation } from 'react-i18next';
import { ADMIN_TAB_ORDER, ADMIN_TAB_PERMISSIONS, APP_PATHS } from '../../../app/route-meta';

export const AdminPage = () => {
    const { user, hasPermission, isLoading } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || '');
    const { t } = useTranslation();

    const firstAllowedTab = ADMIN_TAB_ORDER.find((tab) => hasPermission(ADMIN_TAB_PERMISSIONS[tab]));

    // Sync with URL
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (!tab) {
            if (firstAllowedTab) {
                navigate(`${APP_PATHS.admin}?tab=${firstAllowedTab}`, { replace: true });
            }
            return;
        }

        if (tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [searchParams, activeTab, firstAllowedTab, navigate]);

    useEffect(() => {
        if (!user) navigate(APP_PATHS.home);
    }, [user, navigate]);

    const TAB_PANELS: Record<string, React.ReactNode> = {
        'users': <UserManagement />,
        'systems': <SystemManagement />,
        'teams': <TeamManagement />,
        'slas': <SLAManagement />,
        'escalation': <EscalationManagement />,
        'auto-assign': <AutoAssignManagement />,
        'webhooks': <WebhookManagement />,
        'roles': <RoleManagerPage />,
        'health': <HealthDashboardPage />,
        'audit': <AuditLogsPage />,
        'audit-config': <AuditConfig />,
        'email-templates': <EmailTemplates />,
        'settings': <SmtpSettings />,
    };

    const panel = TAB_PANELS[activeTab];

    if (isLoading) {
        return null;
    }

    if (!activeTab || !ADMIN_TAB_PERMISSIONS[activeTab] || !hasPermission(ADMIN_TAB_PERMISSIONS[activeTab])) {
        return <Navigate to={APP_PATHS.forbidden} replace />;
    }

    if (!panel) {
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

    // No tabs — sidebar handles all navigation. Just render the selected panel.
    return <div>{panel}</div>;
};

export default AdminPage;
