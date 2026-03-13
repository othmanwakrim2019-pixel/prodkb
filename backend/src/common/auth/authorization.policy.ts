import { UserRole } from '../../constants';

export interface AuthorizationSubject {
    id?: string;
    role?: string | null;
    permissions?: string[] | null;
}

const normalize = (value?: string | null) => value?.trim().toUpperCase() || '';

export const normalizeRole = normalize;

export const isAdminRole = (role?: string | null) => {
    const normalized = normalize(role);
    return normalized === UserRole.ADMIN || normalized === 'ADMIN';
};

export const hasRole = (subject: AuthorizationSubject | undefined, roles: string[]) => {
    if (!subject?.role) return false;
    const subjectRole = normalize(subject.role);
    return roles.some((role) => normalize(role) === subjectRole);
};

export const hasPermission = (subject: AuthorizationSubject | undefined, permission: string) => {
    if (!subject) return false;
    if (isAdminRole(subject.role)) return true;
    return (subject.permissions || []).includes(permission);
};
