import type { Incident, Job, SLA, System, Team, Log, Procedure } from '../../../types';

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface IncidentQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    severity?: string;
    systemId?: string;
    teamId?: string;
    startDate?: string;
    endDate?: string;
}

export interface DashboardStats {
    createdToday: number;
    resolvedToday: number;
    activeIncidents: number;
    avgResolutionTimeMinutes: number;
    trends: Array<{ date: string; created: number; resolved: number }>;
    statusBreakdown: Array<{ status: string; count: number }>;
    topSystems: Array<{ systemId: string; name: string; count: number }>;
    myWork?: { myTeamQueue: number; myTeamBreaches: number };
}

export interface SimilarIncident {
    id: string;
    title: string;
    status: string;
    severity: string;
    createdAt: string;
    linkedProcedure?: { id: string; title: string } | null;
}

export interface PostMortem {
    id: string;
    summary: string;
    rootCause: string;
    timeline: string;
    impact: string;
    lessonsLearned: string;
    preventiveActions: string;
    status: string;
    createdBy?: { name: string };
    updatedAt: string;
}

export interface WarRoomMessage {
    id: string;
    content: string;
    type: 'message' | 'system_event';
    createdAt: string;
    user: { id: string; name: string };
}

export interface ActivityEntry {
    id: string;
    logType: string;         // 'activity' | 'note' | 'investigation' | 'file' | ...
    rawLog: string | null;
    fileName: string | null;
    mimeType: string | null;
    createdAt: string;
    createdBy: { id: string; name: string; email: string } | null;
}

export interface IncidentEvent {
    type: 'incident.created' | 'incident.updated' | 'incident.resolved' | 'incident.deleted' | 'log.added' | 'connected';
    incidentId?: string;
    data?: {
        id: string;
        title?: string;
        status?: string;
        severity?: string;
        systemName?: string;
        [key: string]: unknown;
    };
    timestamp: string;
}

export interface FilterPreset {
    id: string;
    name: string;
    params: Record<string, string>;
}

export interface CreateIncidentFormValues {
    title: string;
    description: string;
    severity: string;
    systemId: string;
    jobId: string;
    assignedTeamId: string;
    slaId: string;
    environment: string;
    impact: string;
    detectionSource: string;
    logs: { logType: string; rawLog: string; errorMessage: string }[];
}
