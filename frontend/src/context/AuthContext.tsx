import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from '../utils/axios';

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
    token: string | null;
    login: (token: string, user: User) => void;
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
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            // Skip token validation if we're on the login page
            if (window.location.pathname === '/login') {
                setIsLoading(false);
                return;
            }

            if (token) {
                try {
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    const response = await axios.get('/auth/me');
                    setUser(response.data);
                } catch (error) {
                    console.error('Failed to fetch user', error);
                    logout();
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, [token]);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(newUser);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
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
            token,
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
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
