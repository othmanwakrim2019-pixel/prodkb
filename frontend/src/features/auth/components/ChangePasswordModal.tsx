import { useState } from 'react';
import { Key, X, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authService } from '../api/auth.service';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ChangePasswordModal = ({ isOpen, onClose }: ChangePasswordModalProps) => {
    const { t } = useTranslation();
    const [currentPassword,  setCurrentPassword]  = useState('');
    const [newPassword,      setNewPassword]      = useState('');
    const [confirmPassword,  setConfirmPassword]  = useState('');
    const [showCurrent,      setShowCurrent]      = useState(false);
    const [showNew,          setShowNew]          = useState(false);
    const [error,            setError]            = useState('');
    const [success,          setSuccess]          = useState('');
    const [loading,          setLoading]          = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError(t('password.mismatch'));
            return;
        }
        if (newPassword.length < 8) {
            setError(t('password.minLength'));
            return;
        }

        setLoading(true);
        try {
            await authService.changePassword({ currentPassword, newPassword });
            setSuccess(t('password.success'));
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => onClose(), 1500);
        } catch (error: unknown) {
            const requestError = error as { response?: { data?: { message?: string } } };
            setError(requestError.response?.data?.message || t('password.failed'));
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setError('');
        setSuccess('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
    };

    if (!isOpen) return null;

    const PasswordField = ({
        id, label, value, onChange, show, onToggle,
    }: {
        id: string; label: string; value: string;
        onChange: (v: string) => void; show: boolean; onToggle: () => void;
    }) => (
        <div>
            <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="ent-input pr-10"
                    required
                    minLength={8}
                    autoComplete="current-password"
                />
                <button
                    type="button"
                    onClick={onToggle}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    tabIndex={-1}
                >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-lg animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-primary" />
                        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('password.title')}</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        type="button"
                        className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {error && (
                        <div className="flex items-start gap-2 rounded border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-400">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="flex items-start gap-2 rounded border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
                            {success}
                        </div>
                    )}

                    <PasswordField
                        id="current-password"
                        label={t('password.currentPassword')}
                        value={currentPassword}
                        onChange={setCurrentPassword}
                        show={showCurrent}
                        onToggle={() => setShowCurrent(v => !v)}
                    />
                    <PasswordField
                        id="new-password"
                        label={t('password.newPassword')}
                        value={newPassword}
                        onChange={setNewPassword}
                        show={showNew}
                        onToggle={() => setShowNew(v => !v)}
                    />
                    <div>
                        <label htmlFor="confirm-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                            {t('password.confirmPassword')}
                        </label>
                        <input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="ent-input"
                            required
                            minLength={8}
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button type="button" onClick={handleClose} className="ent-btn-secondary flex-1 justify-center">
                            {t('common.cancel')}
                        </button>
                        <button type="submit" disabled={loading} className="ent-btn-primary flex-1 justify-center">
                            {loading ? t('password.changing') : t('password.submit')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
