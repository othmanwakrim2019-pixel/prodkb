
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PermissionRouteProps {
    permission: string;
}

export const PermissionRoute = ({ permission }: PermissionRouteProps) => {
    const { hasPermission, isLoading } = useAuth();

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!hasPermission(permission)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};
