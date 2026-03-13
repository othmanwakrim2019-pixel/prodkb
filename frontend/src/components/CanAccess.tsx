import { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

interface CanAccessProps {
    permission: string;
    children: ReactNode;
}

export const CanAccess = ({ permission, children }: CanAccessProps) => {
    const { hasPermission, isLoading } = useAuth();

    if (isLoading) {
        return null;
    }

    if (!hasPermission(permission)) {
        return null;
    }

    return <>{children}</>;
};
