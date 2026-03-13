/**
 * Procedure API Service — CRUD + search for procedures
 */
import api from '../../../utils/axios';
import { unwrapArray, unwrapObject } from '../../../utils/api-response';
import type { Procedure } from '../../../types';

export const procedureService = {
    getAll: async (params?: { search?: string }): Promise<Procedure[]> => {
        const response = await api.get('/api/v1/procedures', { params });
        return unwrapArray<Procedure>(response.data, ['data', 'items', 'procedures']);
    },

    getById: async (id: string): Promise<Procedure> => {
        const response = await api.get(`/api/v1/procedures/${id}`);
        return unwrapObject<Procedure>(response.data) as Procedure;
    },

    create: async (data: Record<string, unknown>): Promise<Procedure> => {
        const response = await api.post('/api/v1/procedures', data);
        return unwrapObject<Procedure>(response.data) as Procedure;
    },

    update: async (id: string, data: Record<string, unknown>): Promise<Procedure> => {
        const response = await api.put(`/api/v1/procedures/${id}`, data);
        return unwrapObject<Procedure>(response.data) as Procedure;
    },

    delete: (id: string): Promise<void> =>
        api.delete(`/api/v1/procedures/${id}`),
};

