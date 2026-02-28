/**
 * UserProfileDropdown — Upward popover from the sidebar bottom
 * Shows user info, language toggle, change password, and sign out.
 */
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Key, LogOut, Globe, ChevronUp } from 'lucide-react';

interface UserProfileDropdownProps {
    user: { name: string; email?: string; role: string } | null;
    onChangePassword: () => void;
    onLogout: () => void;
}

export const UserProfileDropdown = ({ user, onChangePassword, onLogout }: UserProfileDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language?.startsWith('fr') ? 'fr' : 'en';

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        if (isOpen) document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen]);

    const toggleLang = () => {
        i18n.changeLanguage(currentLang === 'fr' ? 'en' : 'fr');
    };

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : '?';

    return (
        <div ref={dropdownRef} className="relative">
            {/* Popover — opens upward */}
            {isOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 mx-2 animate-popover-up">
                    <div className="bg-white rounded-xl shadow-2xl border border-slate-200/80 overflow-hidden">
                        {/* User info header */}
                        <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200/60">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                    {initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
                                    {user?.email && (
                                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                    )}
                                    <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
                                        {user?.role}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-1.5">
                            {/* Language toggle */}
                            <button
                                onClick={toggleLang}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                <Globe className="h-4 w-4 text-slate-400" />
                                <span className="flex-1 text-left">{currentLang === 'fr' ? 'Switch to English' : 'Passer au français'}</span>
                                <span className="flex items-center gap-1">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${currentLang === 'fr' ? 'bg-primary/10 text-primary' : 'text-slate-400'}`}>FR</span>
                                    <span className="text-slate-300">/</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${currentLang === 'en' ? 'bg-primary/10 text-primary' : 'text-slate-400'}`}>EN</span>
                                </span>
                            </button>

                            {/* Change password */}
                            <button
                                onClick={() => { setIsOpen(false); onChangePassword(); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                <Key className="h-4 w-4 text-slate-400" />
                                <span>{t('common.changePassword')}</span>
                            </button>

                            <div className="my-1 mx-2 border-t border-slate-100" />

                            {/* Sign out */}
                            <button
                                onClick={() => { setIsOpen(false); onLogout(); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <LogOut className="h-4 w-4" />
                                <span>{t('common.signOut')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Trigger — clickable user row */}
            <div className="border-t border-white/10">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors group"
                >
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-white/25 to-white/10 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/20 group-hover:ring-white/40 transition-all">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                        <p className="text-[11px] text-white/50">{user?.role}</p>
                    </div>
                    <ChevronUp className={`h-4 w-4 text-white/40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>
        </div>
    );
};
