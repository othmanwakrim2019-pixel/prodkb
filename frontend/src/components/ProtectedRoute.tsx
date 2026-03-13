import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ReactNode } from 'react';
import { PageLoader } from './ui/PageLoader';

interface ProtectedRouteProps {
    permission?: string;
    children: ReactNode;
}

export const ProtectedRoute = ({ permission, children }: ProtectedRouteProps) => {
    const { isAuthenticated, isLoading, hasPermission } = useAuth();

    if (isLoading) {
        return <PageLoader />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (permission && !hasPermission(permission)) {
        return <Navigate to="/403" replace />;
    }

    return <>{children}</>;
};
