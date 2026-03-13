import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authService } from '../api/auth.service';
import { useAuth } from '../../../context/AuthContext';

interface LoginFormData {
    email: string;
    password: string;
    remember: boolean;
}

export const LoginPage = () => {
    const savedEmail = localStorage.getItem('rememberedEmail') || '';
    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        defaultValues: { email: savedEmail, remember: !!savedEmail },
    });
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        const persistedError = sessionStorage.getItem('loginError');
        if (persistedError) {
            setError(persistedError);
            sessionStorage.removeItem('loginError');
        }
    }, []);

    const onSubmit = async (data: LoginFormData) => {
        setError('');
        sessionStorage.removeItem('loginError');
        setIsLoading(true);
        try {
            if (data.remember) {
                localStorage.setItem('rememberedEmail', data.email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }

            await authService.login(data.email, data.password);
            await login();
            navigate('/');
        } catch (error: unknown) {
            const requestError = error as { response?: { data?: { message?: string; error?: { code?: string } } }; message?: string };
            const backendMessage = requestError.response?.data?.message;
            const errorCode = requestError.response?.data?.error?.code;
            const errorMessage = backendMessage || errorCode || requestError.message || t('login.loginFailed');
            setError(errorMessage);
            sessionStorage.setItem('loginError', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100">
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
                <div className="mb-8 text-center">
                    <img src="/logo.png" alt="CIH Bank" className="mx-auto mb-4 h-24" />
                    <p className="text-sm text-slate-600">{t('login.subtitle')}</p>
                </div>

                {error && (
                    <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">{t('login.emailLabel')}</label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <User className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                {...register('email', { required: t('login.emailRequired') })}
                                type="email"
                                autoComplete="username email"
                                className="block w-full rounded-md border border-slate-300 p-2 pl-10 text-sm shadow-sm focus:border-accent focus:ring-accent"
                                placeholder={t('login.emailPlaceholder')}
                            />
                        </div>
                        {errors.email && <p className="mt-1 text-xs text-red-500">{String(errors.email.message)}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">{t('login.passwordLabel')}</label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Lock className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                {...register('password', { required: t('login.passwordRequired') })}
                                type="password"
                                autoComplete="current-password"
                                className="block w-full rounded-md border border-slate-300 p-2 pl-10 text-sm shadow-sm focus:border-accent focus:ring-accent"
                                placeholder={t('login.passwordPlaceholder')}
                            />
                        </div>
                        {errors.password && <p className="mt-1 text-xs text-red-500">{String(errors.password.message)}</p>}
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                {...register('remember')}
                                id="remember-me"
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-accent"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">
                                {t('login.rememberMe', 'Remember me')}
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isLoading ? t('login.signingIn') : t('login.signIn')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
