import { Permission } from '../../../../constants';
import { isAdminRole, normalizeRole } from '../../../../common/auth/authorization.policy';

const GLOBAL_INCIDENT_PERMISSIONS = new Set([
    Permission.VIEW_ALL_INCIDENTS,
    'INCIDENT_VIEW_ALL',
    'incident_view_all',
    'view_all_incidents',
]);

export const hasGlobalIncidentAccess = (user?: { role?: string; permissions?: string[] }) => {
    if (!user) return false;

    if (isAdminRole(user.role)) {
        return true;
    }

    const permissions = user.permissions || [];
    return permissions.some((permission) => GLOBAL_INCIDENT_PERMISSIONS.has(permission) || GLOBAL_INCIDENT_PERMISSIONS.has(normalizeRole(permission)));
};

export const getScopedIncidentTeamIds = (user?: { role?: string; permissions?: string[]; teamIds?: string[] }) => {
    if (!user || hasGlobalIncidentAccess(user)) {
        return null;
    }

    return user.teamIds || [];
};

export const canAccessIncidentTeam = (
    user: { role?: string; permissions?: string[]; teamIds?: string[] } | undefined,
    incidentTeamId?: string | null,
) => {
    if (hasGlobalIncidentAccess(user)) {
        return true;
    }

    if (!incidentTeamId) {
        return false;
    }

    const teamIds = user?.teamIds || [];
    return teamIds.includes(incidentTeamId);
};
