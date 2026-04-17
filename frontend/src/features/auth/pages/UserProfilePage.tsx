/**
 * UserProfilePage — lets the logged-in user view and edit their own profile.
 * Accessible from the user dropdown menu → "My Profile"
 */
import { useState, useEffect } from 'react';
import { User, Mail, Shield, Users, Lock, CheckCircle, Pencil, X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/ui/Toast';
import api from '../../../utils/axios';

interface ProfileForm {
    name: string;
    email: string;
}

interface PasswordForm {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export const UserProfilePage = () => {
    const { user, login } = useAuth();
    const toast = useToast();

    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<ProfileForm>({ name: user?.name || '', email: user?.email || '' });

    const [changingPassword, setChangingPassword] = useState(false);
    const [pwForm, setPwForm] = useState<PasswordForm>({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [pwSaving, setPwSaving] = useState(false);
    const [showPw, setShowPw] = useState(false);

    // Only reset form when a different user logs in — NOT on every render.
    // Using user?.id as dep prevents the focus-stealing bug caused by context
    // recreating the user object on polling intervals.
    useEffect(() => {
        if (user) setForm({ name: user.name, email: user.email });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    const handleSave = async () => {
        if (!form.name.trim()) return toast.error('Name is required');
        setSaving(true);
        try {
            await api.put('/auth/v1/me', { name: form.name.trim(), email: form.email.trim() });
            // Re-fetch user to update context
            await login();
            setEditing(false);
            toast.success('Profile updated successfully');
        } catch (err: unknown) {
            const errorOptions = err as { response?: { data?: { message?: string } } };
            toast.error(errorOptions?.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async () => {
        if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match');
        if (pwForm.newPassword.length < 8) return toast.error('Password must be at least 8 characters');
        setPwSaving(true);
        try {
            await api.put('/auth/v1/me/password', {
                currentPassword: pwForm.currentPassword,
                newPassword: pwForm.newPassword,
            });
            setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setChangingPassword(false);
            toast.success('Password changed successfully');
        } catch (err: unknown) {
             const errorOptions = err as { response?: { data?: { message?: string } } };
            toast.error(errorOptions?.response?.data?.message || 'Failed to change password');
        } finally {
            setPwSaving(false);
        }
    };

    const avatar = user?.name?.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) || '??';

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your account information and security settings</p>
            </div>

            {/* Avatar + Info card */}
            <div className="ent-card p-6">
                <div className="flex items-start gap-5">
                    {/* Avatar */}
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white text-xl font-bold shadow-lg flex-shrink-0">
                        {avatar}
                    </div>

                    <div className="flex-1 min-w-0">
                        {editing ? (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        className="ent-input w-full"
                                        placeholder="Your full name"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        className="ent-input w-full"
                                        placeholder="your@email.com"
                                    />
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <button onClick={handleSave} disabled={saving} className="ent-btn-primary">
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button onClick={() => { setEditing(false); setForm({ name: user?.name || '', email: user?.email || '' }); }} className="ent-btn-secondary">
                                        <X className="h-3.5 w-3.5" /> Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{user?.name}</h2>
                                    <button onClick={() => setEditing(true)} className="p-1 text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors" title="Edit profile">
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{user?.email}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Details card */}
            <div className="ent-card p-6 space-y-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Account Details</h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    <div className="flex items-center gap-3 py-3">
                        <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Full Name</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user?.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 py-3">
                        <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Email Address</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user?.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 py-3">
                        <Shield className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Role</p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold mt-0.5 ${
                                user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                : user?.role === 'EXPERT' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                                {user?.role || 'VIEWER'}
                            </span>
                        </div>
                    </div>
                    {user?.team && (
                        <div className="flex items-center gap-3 py-3">
                            <Users className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-xs text-slate-500 dark:text-slate-400">Team</p>
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.team}</p>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-3 py-3">
                        <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Permissions</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user?.permissions?.length ?? 0} permissions granted</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Security card */}
            <div className="ent-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Lock className="h-4 w-4 text-slate-400" /> Security
                    </h3>
                    {!changingPassword && (
                        <button onClick={() => setChangingPassword(true)} className="ent-btn-secondary text-xs">
                            Change Password
                        </button>
                    )}
                </div>

                {changingPassword ? (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Current Password</label>
                            <div className="relative">
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    value={pwForm.currentPassword}
                                    onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                                    className="ent-input w-full pr-10"
                                    autoFocus
                                />
                                <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">New Password</label>
                            <input type={showPw ? 'text' : 'password'} value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} className="ent-input w-full" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Confirm New Password</label>
                            <input type={showPw ? 'text' : 'password'} value={pwForm.confirmPassword} onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} className="ent-input w-full" />
                        </div>
                        <div className="flex gap-2 pt-1">
                            <button onClick={handlePasswordChange} disabled={pwSaving} className="ent-btn-primary">
                                {pwSaving ? 'Saving...' : 'Update Password'}
                            </button>
                            <button onClick={() => { setChangingPassword(false); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }} className="ent-btn-secondary">
                                <X className="h-3.5 w-3.5" /> Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">••••••••••••  Last changed: unknown</p>
                )}
            </div>
        </div>
    );
};

export default UserProfilePage;
