import { useState, useEffect } from "react";
import { Save, Send, ShieldCheck, AlertCircle, CheckCircle } from "lucide-react";
import { configService } from '../../services/admin.service';

export const Settings = () => {
    const [config, setConfig] = useState({
        host: "",
        port: 587,
        user: "",
        pass: "",
        from: "",
        secure: false,
    });
    const [testEmail, setTestEmail] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [auditConfig, setAuditConfig] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchConfig();
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
        }
    };

    const fetchConfig = async () => {
        try {
            const data = await configService.getSmtp();
            setConfig(data as any);
        } catch (error) {
            console.error("Failed to fetch SMTP config", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'port' ? parseInt(value) : value)
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            await configService.updateSmtp(config);
            setMessage({ type: 'success', text: 'Settings saved successfully' });
        } catch (error) {
            console.error("Failed to save settings", error);
            setMessage({ type: 'error', text: 'Failed to save settings' });
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        if (!testEmail) {
            setMessage({ type: 'error', text: 'Please enter an email address for testing' });
            return;
        }
        setTesting(true);
        setMessage(null);
        try {
            await configService.testSmtp(testEmail);
            setMessage({ type: 'success', text: 'Test email sent successfully! Check your inbox.' });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error("Test email failed", error);
            const errorMsg = error.response?.data?.error || 'Failed to send test email. Check server logs.';
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setTesting(false);
        }
    };

    if (loading) return <div className="p-8">Loading settings...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-8 h-8 text-primary" />
                System Settings
            </h1>

            <div className="bg-white shadow-sm rounded-lg border border-slate-200 p-6">
                <div className="mb-6">
                    <h2 className="text-lg font-medium text-slate-900 border-b pb-2 mb-4">SMTP Configuration</h2>
                    <p className="text-sm text-slate-500 mb-4">
                        Configure the email server settings for sending incident notifications.
                    </p>
                </div>

                {message && (
                    <div className={`p-4 rounded-md mb-6 flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">SMTP Host</label>
                            <input
                                type="text"
                                name="host"
                                value={config.host}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                placeholder="smtp.example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Port</label>
                            <input
                                type="number"
                                name="port"
                                value={config.port}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                placeholder="587"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Username</label>
                            <input
                                type="text"
                                name="user"
                                value={config.user}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Password</label>
                            <input
                                type="password"
                                name="pass"
                                value={config.pass}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700">From Address</label>
                            <input
                                type="text"
                                name="from"
                                value={config.from}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                placeholder="CIH Bank <notifications@cih.co.ma>"
                            />
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="secure"
                                checked={config.secure}
                                onChange={handleChange}
                                className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                            />
                            <label className="ml-2 block text-sm text-slate-900">
                                Use Secure Connection (TLS/SSL)
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </form>

                <div className="mt-8 pt-8 border-t border-slate-200">
                    <h3 className="text-md font-medium text-slate-900 mb-4">Test Configuration</h3>
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700">Test Email Recipient</label>
                            <input
                                type="email"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                placeholder="your-email@example.com"
                            />
                        </div>
                        <button
                            onClick={handleTest}
                            disabled={testing || !config.host}
                            className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                        >
                            <Send className="w-4 h-4 mr-2" />
                            {testing ? 'Sending...' : 'Send Test Email'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Audit Configuration Section */}
            <div className="bg-white shadow-sm rounded-lg border border-slate-200 p-6">
                <div className="mb-6">
                    <h2 className="text-lg font-medium text-slate-900 border-b pb-2 mb-4">Audit Configuration</h2>
                    <p className="text-sm text-slate-500 mb-4">
                        Control which entity types generate audit logs when created, updated, or deleted.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['INCIDENT', 'TEAM', 'USER', 'ROLE', 'PROCEDURE', 'SYSTEM'].map(entityType => (
                        <div key={entityType} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div>
                                <span className="font-medium text-slate-900">{entityType}</span>
                                <p className="text-xs text-slate-500">Log {entityType.toLowerCase()} changes</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={auditConfig[`audit.enabled.${entityType.toLowerCase()}`] !== 'false'}
                                    className="sr-only peer"
                                    onChange={async (e) => {
                                        const key = `audit.enabled.${entityType.toLowerCase()}`;
                                        const value = e.target.checked ? 'true' : 'false';

                                        // Update local state immediately for UI responsiveness
                                        setAuditConfig(prev => ({ ...prev, [key]: value }));

                                        try {
                                            await configService.updateParam(key, value);
                                        } catch (error) {
                                            console.error('Failed to update audit config', error);
                                            // Revert on error
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
