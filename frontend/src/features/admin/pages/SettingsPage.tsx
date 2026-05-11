import { useState, useEffect } from "react";
import { Save, Send, ShieldCheck, AlertCircle, CheckCircle } from "lucide-react";
import { configService, type SmtpConfig } from '../api/admin.service';

const defaultConfig: SmtpConfig = {
    enabled: false,
    host: "",
    port: 587,
    user: "",
    pass: "",
    passwordConfigured: false,
    from: "",
    secure: false,
    tlsMode: 'starttls',
    rejectUnauthorized: true,
    replyTo: "",
    connectionTimeout: 10000,
};

export const SettingsPage = () => {
    const [config, setConfig] = useState<SmtpConfig>(defaultConfig);
    const [testEmail, setTestEmail] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const data = await configService.getSmtp();
            setConfig({
                ...defaultConfig,
                ...data,
                pass: '',
                secure: data.secure ?? data.tlsMode === 'ssl',
                tlsMode: data.tlsMode ?? (data.secure ? 'ssl' : 'starttls'),
                rejectUnauthorized: data.rejectUnauthorized ?? true,
                connectionTimeout: data.connectionTimeout ?? 10000,
            });
        } catch (error) {
            console.error("Failed to fetch SMTP config", error);
            setMessage({ type: 'error', text: 'Failed to load SMTP configuration' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : false;

        setConfig(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'port' || name === 'connectionTimeout' ? Number(value) : value),
            ...(name === 'tlsMode' ? { secure: value === 'ssl' } : {}),
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            const saved = await configService.updateSmtp({
                ...config,
                pass: config.pass.trim(),
            });
            setConfig(prev => ({
                ...prev,
                ...saved,
                pass: '',
                passwordConfigured: saved.passwordConfigured ?? (prev.passwordConfigured || Boolean(config.pass.trim())),
            }));
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
            const result = await configService.testSmtp(testEmail);
            setMessage({ type: 'success', text: result.message || 'Test email sent successfully' });
        } catch (error: any) {
            console.error("Test email failed", error);
            const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to send test email. Check server logs.';
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setTesting(false);
        }
    };

    if (loading) return <div className="p-8">Loading settings...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-8 h-8 text-primary" />
                SMTP Configuration
            </h1>

            <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Configure the email server settings for incident, task, and operational notifications.
                </p>

                {message && (
                    <div className={`p-4 rounded-md mb-6 flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-5">
                    <div className="flex items-center justify-between p-4 rounded-md bg-slate-50 dark:bg-slate-700/50">
                        <div>
                            <div className="font-medium text-slate-900 dark:text-white">Email Sending</div>
                            <p className="text-xs text-slate-500">Disable this to keep SMTP settings saved without sending emails.</p>
                        </div>
                        <input type="checkbox" name="enabled" checked={config.enabled} onChange={handleChange}
                            className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">SMTP Host</label>
                            <input type="text" name="host" value={config.host} onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                placeholder="smtp.example.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Port</label>
                            <input type="number" name="port" value={config.port} onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                placeholder="587" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
                            <input type="text" name="user" value={config.user} onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                            <input type="password" name="pass" value={config.pass} onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                placeholder={config.passwordConfigured ? 'Password saved. Leave blank to keep it.' : ''} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">From Address</label>
                            <input type="text" name="from" value={config.from} onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                placeholder="CIH Bank <notifications@cih.co.ma>" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Reply-To</label>
                            <input type="email" name="replyTo" value={config.replyTo || ''} onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                placeholder="support@cih.co.ma" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">TLS Mode</label>
                            <select name="tlsMode" value={config.tlsMode || 'starttls'} onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm">
                                <option value="starttls">STARTTLS / Port 587</option>
                                <option value="ssl">SSL / Port 465</option>
                                <option value="none">No TLS</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Connection Timeout ms</label>
                            <input type="number" name="connectionTimeout" value={config.connectionTimeout || 10000} onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" name="rejectUnauthorized" checked={config.rejectUnauthorized !== false} onChange={handleChange}
                                className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded" />
                            <label className="block text-sm text-slate-900 dark:text-slate-300">Reject invalid TLS certificates</label>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button type="submit" disabled={saving}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </form>

                <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="text-md font-medium text-slate-900 dark:text-white mb-4">Test Configuration</h3>
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Test Email Recipient</label>
                            <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)}
                                className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                placeholder="your-email@example.com" />
                        </div>
                        <button onClick={handleTest} disabled={testing || !config.host || !config.enabled}
                            className="inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50">
                            <Send className="w-4 h-4 mr-2" />
                            {testing ? 'Sending...' : 'Send Test Email'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
