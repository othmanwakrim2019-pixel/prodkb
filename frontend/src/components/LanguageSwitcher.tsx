import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const currentLang = i18n.language?.startsWith('fr') ? 'fr' : 'en';

    const toggle = () => {
        i18n.changeLanguage(currentLang === 'fr' ? 'en' : 'fr');
    };

    return (
        <button
            onClick={toggle}
            className="w-full flex items-center px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white rounded-md transition-colors"
            title={currentLang === 'fr' ? 'Switch to English' : 'Passer au français'}
        >
            <Globe className="mr-3 h-5 w-5" />
            <span className="flex items-center gap-2">
                <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${currentLang === 'fr' ? 'bg-white/20 text-white' : 'text-white/40'}`}>FR</span>
                <span className="text-white/40">/</span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${currentLang === 'en' ? 'bg-white/20 text-white' : 'text-white/40'}`}>EN</span>
            </span>
        </button>
    );
};
