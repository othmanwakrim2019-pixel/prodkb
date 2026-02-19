/**
 * Procedure API Service — CRUD + search for procedures
 */
import { api } from '../lib/api';
import type { Procedure } from '../types';

export const procedureService = {
    getAll: (params?: { search?: string }): Promise<Procedure[]> =>
        api.get('/api/v1/procedures', { params }).then(r => r.data),

    getById: (id: string): Promise<Procedure> =>
        api.get(`/api/v1/procedures/${id}`).then(r => r.data),

    create: (data: Record<string, unknown>): Promise<Procedure> =>
        api.post('/api/v1/procedures', data).then(r => r.data),

    update: (id: string, data: Record<string, unknown>): Promise<Procedure> =>
        api.put(`/api/v1/procedures/${id}`, data).then(r => r.data),

    delete: (id: string): Promise<void> =>
        api.delete(`/api/v1/procedures/${id}`),
};
