import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ReactNode } from 'react';
import { PageLoader } from './ui/PageLoader';
import { APP_PATHS, getFirstAccessiblePath } from '../app/route-meta';

interface ProtectedRouteProps {
    permission?: string;
    children: ReactNode;
}

export const ProtectedRoute = ({ permission, children }: ProtectedRouteProps) => {
    const { isAuthenticated, isLoading, hasPermission } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <PageLoader />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (permission && !hasPermission(permission)) {
        const fallbackPath = getFirstAccessiblePath(hasPermission);
        const currentPath = `${location.pathname}${location.search}`;

        if (fallbackPath && fallbackPath !== currentPath) {
            return <Navigate to={fallbackPath} replace />;
        }

        return <Navigate to={APP_PATHS.forbidden} replace />;
    }

    return <>{children}</>;
};
