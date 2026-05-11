import { useState, useEffect } from "react";
import { configService } from '../api/admin.service';
import { ShieldCheck } from 'lucide-react';

const AUDIT_ENTITIES = [
    { type: 'INCIDENT', label: 'Incidents', description: 'Incident create, update, delete, and status activity' },
    { type: 'SYSTEM', label: 'Systems', description: 'Systems and application jobs' },
    { type: 'JOB', label: 'Jobs', description: 'Dollar Universe job definitions' },
    { type: 'TEAM', label: 'Teams', description: 'Team profile and membership changes' },
    { type: 'USER', label: 'Users', description: 'User profile and access changes' },
    { type: 'ROLE', label: 'Roles', description: 'Role and permission changes' },
    { type: 'PROCEDURE', label: 'Procedures', description: 'Knowledge base procedure changes' },
    { type: 'SLA', label: 'SLA', description: 'SLA policy changes' },
    { type: 'PLANNING_JOB', label: 'Planning Jobs', description: 'Scheduled planning job definitions' },
    { type: 'PLANNING_INSTANCE', label: 'Planning Instances', description: 'Daily planning execution records' },
    { type: 'ASTREINTE', label: 'Astreinte', description: 'On-call assignment changes' },
    { type: 'DAILY_PLAN', label: 'Daily Plans', description: 'Manager daily plan changes' },
    { type: 'OPERATIONAL_TASK', label: 'Operational Tasks', description: 'Operator task creation and state changes' },
] as const;

export const AuditConfigPage = () => {
    const [auditConfig, setAuditConfig] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAuditConfig();
    }, []);

    const keyFor = (entityType: string) => `audit.enabled.${entityType.toLowerCase()}`;

    const fetchAuditConfig = async () => {
        try {
            const keys = AUDIT_ENTITIES.map(entity => keyFor(entity.type));
            const data = await configService.getParams(keys);
            setAuditConfig(
                data.reduce<Record<string, string>>((acc, item) => {
                    acc[item.key] = item.value;
                    return acc;
                }, {})
            );
        } catch (error) {
            console.error("Failed to fetch audit config", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleAudit = async (entityType: string, checked: boolean) => {
        const key = keyFor(entityType);
        const value = checked ? 'true' : 'false';
        const previous = auditConfig[key];
        setAuditConfig(prev => ({ ...prev, [key]: value }));

        try {
            await configService.updateParam(key, value);
        } catch (error) {
            console.error('Failed to update audit config', error);
            setAuditConfig(prev => ({ ...prev, [key]: previous ?? 'true' }));
        }
    };

    if (loading) return <div className="p-8">Loading audit configuration...</div>;

    return (
        <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                <ShieldCheck className="w-8 h-8 text-primary" />
                Audit Configuration
            </h1>

            <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    Control which entity types generate audit logs when users create, update, or delete business records.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {AUDIT_ENTITIES.map(entity => {
                        const key = keyFor(entity.type);
                        const checked = auditConfig[key] !== 'false';

                        return (
                            <div key={entity.type} className="flex items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                <div>
                                    <span className="font-medium text-slate-900 dark:text-white">{entity.label}</span>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{entity.description}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        className="sr-only peer"
                                        onChange={(e) => toggleAudit(entity.type, e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        );
                    })}
                </div>

                <p className="mt-4 text-xs text-slate-400 italic">
                    Missing config keys default to enabled. Changes take effect immediately.
                </p>
            </div>
        </div>
    );
};

export default AuditConfigPage;
