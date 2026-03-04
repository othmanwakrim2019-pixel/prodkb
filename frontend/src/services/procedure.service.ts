/**
 * Procedure API Service — CRUD + search for procedures
 */
import { api } from '../lib/api';
import type { Procedure } from '../types';

export const procedureService = {
    getAll: async (params?: { search?: string }): Promise<Procedure[]> => {
        const response = await api.get('/api/v1/procedures', { params });
        return response.data;
    },

    getById: async (id: string): Promise<Procedure> => {
        const response = await api.get(`/api/v1/procedures/${id}`);
        return response.data;
    },

    create: async (data: Record<string, unknown>): Promise<Procedure> => {
        const response = await api.post('/api/v1/procedures', data);
        return response.data;
    },

    update: async (id: string, data: Record<string, unknown>): Promise<Procedure> => {
        const response = await api.put(`/api/v1/procedures/${id}`, data);
        return response.data;
    },

    delete: (id: string): Promise<void> =>
        api.delete(`/api/v1/procedures/${id}`),
};
