import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuth } from '../context/AuthContext';
import { Lock, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Login = () => {
    const savedEmail = localStorage.getItem('rememberedEmail') || '';
    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        defaultValues: { email: savedEmail, remember: !!savedEmail }
    });
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();

    // Check for persisted error on mount (in case page refreshed)
    useEffect(() => {
        const persistedError = sessionStorage.getItem('loginError');
        if (persistedError) {
            setError(persistedError);
            sessionStorage.removeItem('loginError'); // Clear after reading
        }
    }, []);

    interface LoginFormData {
        email: string;
        password: string;
        remember: boolean;
    }

    const onSubmit = async (data: LoginFormData) => {
        setError(''); // Clear previous errors
        sessionStorage.removeItem('loginError'); // Clear persisted errors
        setIsLoading(true);
        try {
            if (data.remember) {
                localStorage.setItem('rememberedEmail', data.email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }
            const response = await authService.login(data.email, data.password);
            login(response.user);
            navigate('/');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            const backendMessage = err.response?.data?.message;
            const errorCode = err.response?.data?.error?.code;
            const errorMessage = backendMessage || errorCode || err.message || t('login.loginFailed');
            setError(errorMessage);
            sessionStorage.setItem('loginError', errorMessage);
            console.log('Login failed with error:', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <div className="text-center mb-8">
                    <img src="/logo.png" alt="CIH Bank" className="h-24 mx-auto mb-4" />
                    <p className="text-slate-600 text-sm">{t('login.subtitle')}</p>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('login.emailLabel')}</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                {...register('email', { required: t('login.emailRequired') })}
                                type="email"
                                autoComplete="username email"
                                className="pl-10 block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                placeholder={t('login.emailPlaceholder')}
                            />
                        </div>
                        {errors.email && <p className="text-red-500 text-xs mt-1">{String(errors.email.message)}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('login.passwordLabel')}</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                {...register('password', { required: t('login.passwordRequired') })}
                                type="password"
                                autoComplete="current-password"
                                className="pl-10 block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                placeholder={t('login.passwordPlaceholder')}
                            />
                        </div>
                        {errors.password && <p className="text-red-500 text-xs mt-1">{String(errors.password.message)}</p>}
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                {...register('remember')}
                                id="remember-me"
                                type="checkbox"
                                className="h-4 w-4 text-primary focus:ring-accent border-slate-300 rounded"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">
                                {t('login.rememberMe', 'Remember me')}
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? t('login.signingIn') : t('login.signIn')}
                    </button>
                </form>
            </div>
        </div>
    );
};
