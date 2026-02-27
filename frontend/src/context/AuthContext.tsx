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
        </AuthContext.Provider>
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
