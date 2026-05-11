import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';
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
    const [showPassword, setShowPassword] = useState(false);
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
        <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ── LEFT PANEL — CIH Brand ── */}
            <div
                className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
                style={{ background: 'linear-gradient(160deg, #003d82 0%, #002558 55%, #001a3d 100%)' }}
            >
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                        backgroundSize: '32px 32px',
                    }}
                />

                {/* Decorative arcs */}
                <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full border border-white/10" />
                <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full border border-white/8" />
                <div className="absolute top-1/3 -left-24 h-64 w-64 rounded-full border border-white/5" />

                {/* Orange accent strip */}
                <div className="absolute top-0 left-0 w-1 h-full" style={{ background: '#ff6b35' }} />

                {/* Top — Logo */}
                <div className="relative z-10">
                    <img src="/logo.png" alt="CIH Bank" className="h-14 object-contain brightness-200" />
                </div>

                {/* Middle — Hero copy */}
                <div className="relative z-10 space-y-6">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-300 mb-4 uppercase tracking-wider">
                            <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
                            Operations Center
                        </div>
                        <h1 className="text-4xl font-bold text-white leading-tight">
                            Plateforme de<br />
                            <span style={{ color: '#ff6b35' }}>Gestion des Incidents</span>
                        </h1>
                        <p className="mt-4 text-base text-white/60 leading-relaxed max-w-xs">
                            Centralisez, supervisez et résolvez les incidents opérationnels en temps réel.
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 pt-4">
                        {[
                            { value: '99.9%', label: 'Disponibilité' },
                            { value: '< 5min', label: 'Temps de réponse' },
                            { value: '24/7', label: 'Surveillance' },
                        ].map(stat => (
                            <div key={stat.label} className="rounded-lg border border-white/10 bg-white/5 p-3 text-center backdrop-blur-sm">
                                <p className="text-lg font-bold" style={{ color: '#ff6b35' }}>{stat.value}</p>
                                <p className="text-[11px] text-white/50 mt-0.5">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom — Security notice */}
                <div className="relative z-10 flex items-center gap-2 text-xs text-white/40">
                    <ShieldCheck className="h-3.5 w-3.5 text-white/30" />
                    <span>Accès réservé au personnel autorisé CIH Bank</span>
                </div>
            </div>

            {/* ── RIGHT PANEL — Login Form ── */}
            <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 px-6 py-12">

                {/* Mobile logo */}
                <div className="mb-8 lg:hidden">
                    <img src="/logo.png" alt="CIH Bank" className="h-12 object-contain" />
                </div>

                <div className="w-full max-w-sm">

                    {/* Heading */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-800">
                            {t('login.title', 'Connexion')}
                        </h2>
                        <p className="mt-1.5 text-sm text-slate-500">
                            {t('login.subtitle', 'Entrez vos identifiants pour accéder à la plateforme')}
                        </p>
                        {/* CIH Blue accent line */}
                        <div className="mt-4 flex gap-1">
                            <div className="h-0.5 w-8 rounded-full" style={{ background: '#003d82' }} />
                            <div className="h-0.5 w-3 rounded-full" style={{ background: '#ff6b35' }} />
                            <div className="h-0.5 w-1.5 rounded-full bg-slate-200" />
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

                        {/* Email */}
                        <div>
                            <label htmlFor="login-email" className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                {t('login.emailLabel', 'Adresse e-mail')}
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#003d82] transition-colors" />
                                <input
                                    {...register('email', { required: t('login.emailRequired', "L'e-mail est requis") })}
                                    id="login-email"
                                    type="email"
                                    autoComplete="username email"
                                    placeholder={t('login.emailPlaceholder', 'vous@cihbank.ma')}
                                    className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none shadow-sm transition-all focus:border-[#003d82] focus:ring-2 focus:ring-[#003d82]/15 hover:border-slate-300"
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                                    <AlertCircle className="h-3 w-3" />{String(errors.email.message)}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="login-password" className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                {t('login.passwordLabel', 'Mot de passe')}
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#003d82] transition-colors" />
                                <input
                                    {...register('password', { required: t('login.passwordRequired', 'Le mot de passe est requis') })}
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    placeholder="••••••••••"
                                    className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-12 text-sm text-slate-800 placeholder-slate-400 outline-none shadow-sm transition-all focus:border-[#003d82] focus:ring-2 focus:ring-[#003d82]/15 hover:border-slate-300"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                                    <AlertCircle className="h-3 w-3" />{String(errors.password.message)}
                                </p>
                            )}
                        </div>

                        {/* Remember me */}
                        <div className="flex items-center gap-2.5">
                            <input
                                {...register('remember')}
                                id="remember-me"
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300 text-[#003d82] focus:ring-[#003d82] focus:ring-offset-0 cursor-pointer"
                                style={{ accentColor: '#003d82' }}
                            />
                            <label htmlFor="remember-me" className="text-sm text-slate-600 cursor-pointer select-none">
                                {t('login.rememberMe', 'Se souvenir de moi')}
                            </label>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full overflow-hidden rounded-lg py-3 text-sm font-semibold text-white shadow-md transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 active:translate-y-0"
                            style={{
                                background: isLoading ? '#ff6b35cc' : 'linear-gradient(90deg, #ff6b35 0%, #e85d2b 100%)',
                                boxShadow: '0 4px 14px 0 rgba(255, 107, 53, 0.35)',
                            }}
                        >
                            {/* Shine sweep on hover */}
                            <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[150%] transition-transform duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                            <span className="relative flex items-center justify-center gap-2">
                                {isLoading ? (
                                    <>
                                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                        </svg>
                                        {t('login.signingIn', 'Connexion en cours...')}
                                    </>
                                ) : (
                                    <>
                                        {t('login.signIn', 'Se connecter')}
                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                                    </>
                                )}
                            </span>
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
                        <ShieldCheck className="h-3.5 w-3.5 text-slate-300" />
                        <span>Protégé par Active Directory &amp; SSO — CIH Bank © {new Date().getFullYear()}</span>
                    </div>

                    {/* CIH brand bar */}
                    <div className="mt-6 flex justify-center gap-1">
                        <div className="h-1 w-12 rounded-full" style={{ background: '#003d82' }} />
                        <div className="h-1 w-4 rounded-full" style={{ background: '#ff6b35' }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
