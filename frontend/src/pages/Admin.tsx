import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RoleManager } from './RoleManager';
import AuditLogs from './AuditLogs';
import { Settings as SmtpSettings } from './admin/Settings';
import { AuditConfig } from './admin/AuditConfig';
import HealthDashboard from './HealthDashboard';
import { EmailTemplates } from './admin/EmailTemplates';
import { UserManagement } from './admin/UserManagement';
import { SystemManagement } from './admin/SystemManagement';
import { TeamManagement } from './admin/TeamManagement';
import { SLAManagement } from './admin/SLAManagement';
import { EscalationManagement } from './admin/EscalationManagement';
import { AutoAssignManagement } from './admin/AutoAssignManagement';
import { WebhookManagement } from './admin/WebhookManagement';
import { useTranslation } from 'react-i18next';

export const Admin = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'users');
    const { t } = useTranslation();

    // Sync with URL
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [searchParams, activeTab]);

    useEffect(() => {
        if (!user) navigate('/');
    }, [user, navigate]);

    const TAB_PANELS: Record<string, React.ReactNode> = {
        'users': <UserManagement />,
        'systems': <SystemManagement />,
        'teams': <TeamManagement />,
        'slas': <SLAManagement />,
        'escalation': <EscalationManagement />,
        'auto-assign': <AutoAssignManagement />,
        'webhooks': <WebhookManagement />,
        'roles': <RoleManager />,
        'health': <HealthDashboard />,
        'audit': <AuditLogs />,
        'audit-config': <AuditConfig />,
        'email-templates': <EmailTemplates />,
        'settings': <SmtpSettings />,
    };

    const panel = TAB_PANELS[activeTab];

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

export default Admin;
