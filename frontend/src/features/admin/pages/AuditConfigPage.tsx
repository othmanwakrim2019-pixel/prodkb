import { useState, useEffect } from "react";
import { configService } from '../api/admin.service';
import { ShieldCheck } from 'lucide-react';

export const AuditConfigPage = () => {
    const [auditConfig, setAuditConfig] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAuditConfig();
    }, []);

    const fetchAuditConfig = async () => {
        try {
            const keys = ['INCIDENT', 'TEAM', 'USER', 'ROLE', 'PROCEDURE', 'SYSTEM']
                .map(t => `audit.enabled.${t.toLowerCase()}`)
                .join(',');
            const data = await configService.getParams(keys.split(','));
            setAuditConfig(data as unknown as Record<string, string>);
        } catch (error) {
            console.error("Failed to fetch audit config", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading audit configuration...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                <ShieldCheck className="w-8 h-8 text-primary" />
                Audit Configuration
            </h1>

            <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    Control which entity types generate audit logs when created, updated, or deleted.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['INCIDENT', 'TEAM', 'USER', 'ROLE', 'PROCEDURE', 'SYSTEM'].map(entityType => (
                        <div key={entityType} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                            <div>
                                <span className="font-medium text-slate-900 dark:text-white">{entityType}</span>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Log {entityType.toLowerCase()} changes</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={auditConfig[`audit.enabled.${entityType.toLowerCase()}`] !== 'false'}
                                    className="sr-only peer"
                                    onChange={async (e) => {
                                        const key = `audit.enabled.${entityType.toLowerCase()}`;
                                        const value = e.target.checked ? 'true' : 'false';
                                        setAuditConfig(prev => ({ ...prev, [key]: value }));
                                        try {
                                            await configService.updateParam(key, value);
                                        } catch (error) {
                                            console.error('Failed to update audit config', error);
                                            setAuditConfig(prev => ({ ...prev, [key]: e.target.checked ? 'false' : 'true' }));
                                        }
                                    }}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    ))}
                </div>

                <p className="mt-4 text-xs text-slate-400 italic">
                    Changes take effect immediately. Audit logs are stored in the database and visible in the Audit Logs page.
                </p>
            </div>
        </div>
    );
};

export default AuditConfigPage;
