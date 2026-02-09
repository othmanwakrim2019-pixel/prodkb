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

export const Admin = () => {
    const { user, hasPermission } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'users' | 'systems' | 'teams' | 'slas' | 'roles' | 'audit' | 'settings' | 'email-templates'>('users');

    // Access control check
    useEffect(() => {
        if (!user) {
            navigate('/');
        }
    }, [user, navigate]);

    // Permission checks for tabs
    const showUsers = hasPermission('USER_MANAGE');
    const showSystems = hasPermission('SYSTEM_MANAGE');
    const showTeams = hasPermission('TEAM_MANAGE') || user?.role === 'ADMIN';
    const showSLAs = hasPermission('SLA_MANAGE') || user?.role === 'ADMIN';
    const showRoles = hasPermission('ROLE_MANAGE');
    const showAudit = hasPermission('AUDIT_VIEW');

    // Determine default tab if not set or invalid
    useEffect(() => {
        const isAccessible = (
            (activeTab === 'users' && showUsers) ||
            (activeTab === 'systems' && showSystems) ||
            (activeTab === 'teams' && showTeams) ||
            (activeTab === 'slas' && showSLAs) ||
            (activeTab === 'roles' && showRoles) ||
            (activeTab === 'audit' && showAudit) ||
            (activeTab === 'settings' && hasPermission('SYSTEM_MANAGE')) ||
            (activeTab === 'email-templates' && hasPermission('SYSTEM_MANAGE'))
        );

        if (!isAccessible) {
            if (showUsers) setActiveTab('users');
            else if (showSystems) setActiveTab('systems');
            else if (showTeams) setActiveTab('teams');
            else if (showSLAs) setActiveTab('slas');
            else if (showRoles) setActiveTab('roles');
            else if (showAudit) setActiveTab('audit');
            else if (hasPermission('SYSTEM_MANAGE')) setActiveTab('settings');
        }
    }, [showUsers, showSystems, showTeams, showSLAs, showRoles, showAudit, activeTab, hasPermission]);

    if (!showUsers && !showSystems && !showTeams && !showSLAs && !showRoles && !showAudit) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="bg-red-50 p-6 rounded-full mb-4">
                    <div className="h-12 w-12 text-red-600 flex items-center justify-center">
                        <Shield className="h-12 w-12" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Access Denied</h2>
                <p className="text-slate-600 mt-2 max-w-md">
                    You do not have permission to access the admin panel.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-8 overflow-x-auto">
                    {showUsers && (
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`${activeTab === 'users'
                                ? 'border-accent text-accent'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                        >
                            <Users className="h-5 w-5 mr-2" />
                            User Management
                        </button>
                    )}
                    {showSystems && (
                        <button
                            onClick={() => setActiveTab('systems')}
                            className={`${activeTab === 'systems'
                                ? 'border-accent text-accent'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                        >
                            <Database className="h-5 w-5 mr-2" />
                            Applications & Uprocs
                        </button>
                    )}
                    {showTeams && (
                        <button
                            onClick={() => setActiveTab('teams')}
                            className={`${activeTab === 'teams'
                                ? 'border-accent text-accent'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                        >
                            <UsersIcon className="h-5 w-5 mr-2" />
                            Teams
                        </button>
                    )}
                    {showSLAs && (
                        <button
                            onClick={() => setActiveTab('slas')}
                            className={`${activeTab === 'slas'
                                ? 'border-accent text-accent'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                        >
                            <Clock className="h-5 w-5 mr-2" />
                            SLA Policies
                        </button>
                    )}
                    {showRoles && (
                        <button
                            onClick={() => setActiveTab('roles')}
                            className={`${activeTab === 'roles'
                                ? 'border-accent text-accent'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
                        >
                            <Shield className="h-5 w-5 mr-2" />
                            Roles & Permissions
                        </button>
                    )}
                    {showAudit && (
                        <button
                            onClick={() => setActiveTab('audit')}
                            className={`${activeTab === 'audit'
                                ? 'border-accent text-accent'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
                        >
                            <Activity className="h-5 w-5 mr-2" />
                            Audit Logs
                        </button>
                    )}
                    {hasPermission('SYSTEM_MANAGE') && (
                        <button
                            onClick={() => setActiveTab('email-templates')}
                            className={`${activeTab === 'email-templates'
                                ? 'border-accent text-accent'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
                        >
                            <FileEdit className="h-5 w-5 mr-2" />
                            Email Templates
                        </button>
                    )}
                    {hasPermission('SYSTEM_MANAGE') && (
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`${activeTab === 'settings'
                                ? 'border-accent text-accent'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
                        >
                            <Settings className="h-5 w-5 mr-2" />
                            SMTP Settings
                        </button>
                    )}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="py-4">
                {activeTab === 'users' && <UserManagement />}
                {activeTab === 'systems' && <SystemManagement />}
                {activeTab === 'teams' && <TeamManagement />}
                {activeTab === 'slas' && <SLAManagement />}
                {activeTab === 'roles' && <RoleManager />}
                {activeTab === 'audit' && <AuditLogs />}
                {activeTab === 'email-templates' && <EmailTemplates />}
                {activeTab === 'settings' && <SmtpSettings />}
            </div>
        </div>
    );
};
