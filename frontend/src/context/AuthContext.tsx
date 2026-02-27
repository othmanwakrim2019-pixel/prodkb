import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from '../utils/axios';
import { useIdleTimeout } from '../hooks/useIdleTimeout';

interface User {
    id: string;
    name: string;
    email: string;
    role: string; // Changed from union to string to support custom roles
    permissions: string[]; // Added permissions array
    team?: string;
}

interface AuthContextType {
    user: User | null;
    login: (user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
    // Permission helpers
    hasPermission: (permission: string) => boolean;
    canCreate: () => boolean;
    canEdit: () => boolean;
    canDelete: () => boolean;
    canManageUsers: () => boolean;
    canManageSystems: () => boolean;
    canManageTeams: () => boolean;
    canManageSLAs: () => boolean;
    canManageRoles: () => boolean;
    canViewAudit: () => boolean;
    isAdmin: () => boolean;
    isExpert: () => boolean;
    isOperator: () => boolean;
    isViewer: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            // Skip token validation if we're on the login page
            if (window.location.pathname === '/login') {
                setIsLoading(false);
                return;
            }

            try {
                // The httpOnly cookie is sent automatically by the browser
                // No need to set Authorization header manually
                const response = await axios.get('/auth/v1/me');
                setUser(response.data);
            } catch (error) {
                console.error('Failed to fetch user', error);
                setUser(null);
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = (newUser: User) => {
        // Token is now stored in httpOnly cookie by the backend
        // We only need to store the user info in React state
        setUser(newUser);
    };

    const logout = async () => {
        try {
            // Call backend to clear cookies and revoke refresh token
            await axios.post('/auth/v1/logout');
        } catch (error) {
            console.error('Logout API call failed', error);
        }
        setUser(null);
    };

    // Permission helper functions
    const isAdmin = () => user?.role === 'ADMIN';
    const isExpert = () => user?.role === 'EXPERT';
    const isOperator = () => user?.role === 'OPERATOR';
    const isViewer = () => user?.role === 'VIEWER';

    const hasPermission = (permission: string) => {
        return !!user && user.permissions.includes(permission);
    };

    const canCreate = () => hasPermission('INCIDENT_CREATE');
    const canEdit = () => hasPermission('INCIDENT_EDIT');
    const canDelete = () => hasPermission('INCIDENT_DELETE');

    const canManageUsers = () => {
        return hasPermission('USER_MANAGE');
    };

    const canManageSystems = () => {
        return hasPermission('SYSTEM_MANAGE');
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            isAuthenticated: !!user,
            isLoading,
            hasPermission,
            canCreate,
            canEdit,
            canDelete,
            canManageUsers,
            canManageSystems,
            canManageTeams: () => hasPermission('TEAM_MANAGE'),
            canManageSLAs: () => hasPermission('SLA_MANAGE'),
            canManageRoles: () => hasPermission('ROLE_MANAGE'),
            canViewAudit: () => hasPermission('AUDIT_VIEW'),
            isAdmin,
            isExpert,
            isOperator,
            isViewer
        }}>
            {children}
            {!!user && <SessionTimeoutWarning onLogout={logout} />}
        </AuthContext.Provider>
    );
};

// Session timeout warning banner — rendered inside AuthProvider
const SessionTimeoutWarning = ({ onLogout }: { onLogout: () => void }) => {
    const { showWarning, remaining, dismissWarning } = useIdleTimeout(onLogout, true);

    if (!showWarning) return null;

    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 text-center">
                <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Session Expiring</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Your session will expire in <span className="font-mono font-bold text-amber-600">{mins}:{secs.toString().padStart(2, '0')}</span> due to inactivity.
                </p>
                <button
                    onClick={dismissWarning}
                    className="w-full px-4 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-secondary transition-colors"
                >
                    Stay Connected
                </button>
            </div>
        </div>
    );
};


// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
