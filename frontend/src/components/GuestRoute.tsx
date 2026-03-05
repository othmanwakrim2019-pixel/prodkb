import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * GuestRoute — only renders the page if the user is NOT authenticated.
 * If already logged in, redirect to the dashboard.
 */
export const GuestRoute = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
};
