import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import {
    LayoutDashboard,
    LogOut,
    Settings as SettingsIcon,
    AlertCircle,
    BookOpen,
    Search,
    Key
} from 'lucide-react';
import clsx from 'clsx';
import { ChangePasswordModal } from './ChangePasswordModal';

export const Layout = () => {
    const { user, logout, hasPermission } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        {
            label: 'Dashboard',
            path: '/',
            icon: LayoutDashboard,
            requiredPermission: 'DASHBOARD_VIEW'
        },
        {
            label: 'Incidents / Abends',
            path: '/incidents',
            icon: AlertCircle,
            requiredPermission: 'INCIDENT_VIEW'
        },
        {
            label: 'Procedures',
            path: '/procedures',
            icon: BookOpen,
            requiredPermission: 'PROCEDURE_VIEW'
        },
        {
            label: 'Search',
            path: '/search',
            icon: Search,
            requiredPermission: 'SEARCH_VIEW'
        },
    ];

    if (user?.role === 'ADMIN' || hasPermission('USER_MANAGE')) {
        navItems.push({ label: 'Admin', path: '/admin', icon: SettingsIcon, requiredPermission: 'ROLE_MANAGE' });
    }

    // Filter items based on permissions
    const visibleNavItems = navItems.filter(item => {
        // Always show if no permission required (fallback) but here all have constraints
        if (!item.requiredPermission) return true;
        // Search might be special, if they can view *anything* they can search it? 
        // For now, strict check:
        return hasPermission(item.requiredPermission);
    });

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-primary text-white flex flex-col fixed h-full">
                <div className="p-6 border-b border-white/10">
                    <img src="/logo.png" alt="CIH Bank" className="w-full max-h-20 object-contain" />
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {visibleNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    'flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors',
                                    isActive
                                        ? 'bg-white/10 text-white border-l-4 border-white'
                                        : 'text-white/70 hover:bg-white/5 hover:text-white border-l-4 border-transparent'
                                )}
                            >
                                <Icon className="mr-3 h-5 w-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center mb-4 px-2">
                        <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                                {user?.name.charAt(0)}
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-white">{user?.name}</p>
                            <p className="text-xs text-white/60">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowPasswordModal(true)}
                        className="w-full flex items-center px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white rounded-md transition-colors mb-1"
                    >
                        <Key className="mr-3 h-5 w-5" />
                        Change Password
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white rounded-md transition-colors"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                <Outlet />
            </main>

            {/* Password Change Modal */}
            <ChangePasswordModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
            />
        </div>
    );
};
