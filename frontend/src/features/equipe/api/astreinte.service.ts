/**
 * Astreinte API Service — typed abstraction over all astreinte endpoints
 * Follows the same pattern as incident.service.ts
 */
import api from '../../../utils/axios';
import { unwrapArray, unwrapObject } from '../../../utils/api-response';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AstreinteUser { id: string; name: string; email: string; }
export interface AstreinteTeam { id: string; name: string; }

export interface Astreinte {
    id:         string;
    weekNumber: number;
    year:       number;
    startDate:  string;
    endDate:    string;
    phone:      string | null;
    notes:      string | null;
    teamId:     string;
    team:       AstreinteTeam;
    userId:     string;
    user:       AstreinteUser;
    createdAt:  string;
    updatedAt:  string;
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface CreateAstreinteDto {
    teamId:     string;
    userId:     string;
    weekNumber: number;
    year:       number;
    startDate:  string;
    endDate:    string;
    phone?:     string;
    notes?:     string;
}

export interface UpdateAstreinteDto {
    userId?: string;
    phone?:  string | null;
    notes?:  string | null;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const astreinteService = {
    getCurrent: async (teamId?: string): Promise<Astreinte | null> => {
        if (!teamId) return null;
        const response = await api.get(`/api/v1/astreintes/current/${teamId}`);
        return unwrapObject<Astreinte>(response.data);
    },

    getAll: async (year: number, teamId?: string): Promise<Astreinte[]> => {
        const response = await api.get('/api/v1/astreintes', {
            params: { year, ...(teamId ? { teamId } : {}) },
        });
        return unwrapArray<Astreinte>(response.data, ['data', 'items']);
    },

    create: async (dto: CreateAstreinteDto): Promise<Astreinte> => {
        const response = await api.post('/api/v1/astreintes', dto);
        return unwrapObject<Astreinte>(response.data) as Astreinte;
    },

    update: async (id: string, dto: UpdateAstreinteDto): Promise<Astreinte> => {
        const response = await api.patch(`/api/v1/astreintes/${id}`, dto);
        return unwrapObject<Astreinte>(response.data) as Astreinte;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/api/v1/astreintes/${id}`);
    },
};
