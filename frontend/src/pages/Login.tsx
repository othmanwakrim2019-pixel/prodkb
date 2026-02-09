import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import { Lock, User } from 'lucide-react';

export const Login = () => {
    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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
    }

    const onSubmit = async (data: LoginFormData) => {
        setError(''); // Clear previous errors
        sessionStorage.removeItem('loginError'); // Clear persisted errors
        setIsLoading(true);
        try {
            const response = await axios.post('/auth/login', data);
            login(response.data.token, response.data.user);
            navigate('/');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            // Display the specific error message from backend (works for 401 and 403)
            const errorMessage = err.response?.data?.error || err.message || 'Login failed. Please try again.';
            setError(errorMessage);
            // PERSIST error to sessionStorage in case page refreshes
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
                    <p className="text-slate-600 text-sm">Système de Gestion des Incidents</p>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                {...register('email', { required: 'Email is required' })}
                                type="email"
                                className="pl-10 block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                placeholder="you@example.com"
                            />
                        </div>
                        {errors.email && <p className="text-red-500 text-xs mt-1">{String(errors.email.message)}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                {...register('password', { required: 'Password is required' })}
                                type="password"
                                className="pl-10 block w-full rounded-md border-slate-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm p-2 border"
                                placeholder="••••••••"
                            />
                        </div>
                        {errors.password && <p className="text-red-500 text-xs mt-1">{String(errors.password.message)}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
};
