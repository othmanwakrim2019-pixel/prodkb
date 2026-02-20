/**
 * useIncident Hook Tests
 * Tests the domain hook for single incident detail page.
 */
import { renderHook, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Must define mocks with vi.hoisted so they are available at vi.mock hoist time
const mockIncidentService = vi.hoisted(() => ({
    getById: vi.fn(),
    updateStatus: vi.fn(),
    update: vi.fn(),
    acknowledge: vi.fn(),
    addLog: vi.fn(),
    uploadFile: vi.fn(),
    downloadFile: vi.fn(),
}));

vi.mock('../services/incident.service', () => ({
    incidentService: mockIncidentService,
}));

// Import AFTER vi.mock
import { useIncident } from '../hooks/useIncident';

const mockIncident = {
    id: 'inc-1',
    title: 'Test Incident',
    status: 'OPEN',
    severity: 'High',
    description: 'Test description',
    createdAt: '2024-01-01T00:00:00Z',
};

describe('useIncident', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockIncidentService.getById.mockResolvedValue(mockIncident);
    });

    it('should fetch incident on mount', async () => {
        const { result } = renderHook(() => useIncident('inc-1'));

        // Initially loading
        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.incident).toEqual(mockIncident);
        expect(result.current.error).toBeNull();
        expect(mockIncidentService.getById).toHaveBeenCalledWith('inc-1');
    });

    it('should set error when fetch fails', async () => {
        mockIncidentService.getById.mockRejectedValueOnce(new Error('Network error'));

        const { result } = renderHook(() => useIncident('inc-1'));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBe('Network error');
        expect(result.current.incident).toBeNull();
    });

    it('should not fetch when id is undefined', () => {
        renderHook(() => useIncident(undefined));
        expect(mockIncidentService.getById).not.toHaveBeenCalled();
    });

    it('updateStatus should call service and refresh', async () => {
        mockIncidentService.updateStatus.mockResolvedValue({});

        const { result } = renderHook(() => useIncident('inc-1'));

        await waitFor(() => expect(result.current.loading).toBe(false));

        let success: boolean;
        await act(async () => {
            success = await result.current.updateStatus('RESOLVED');
        });

        expect(success!).toBe(true);
        expect(mockIncidentService.updateStatus).toHaveBeenCalledWith('inc-1', 'RESOLVED');
        // getById called twice: initial + after update
        expect(mockIncidentService.getById).toHaveBeenCalledTimes(2);
    });

    it('updateStatus should return false and set error on failure', async () => {
        mockIncidentService.updateStatus.mockRejectedValueOnce(new Error('Forbidden'));

        const { result } = renderHook(() => useIncident('inc-1'));
        await waitFor(() => expect(result.current.loading).toBe(false));

        let success: boolean;
        await act(async () => {
            success = await result.current.updateStatus('RESOLVED');
        });

        expect(success!).toBe(false);
        expect(result.current.error).toBe('Forbidden');
    });

    it('acknowledge should call service and refresh', async () => {
        mockIncidentService.acknowledge.mockResolvedValue({});

        const { result } = renderHook(() => useIncident('inc-1'));
        await waitFor(() => expect(result.current.loading).toBe(false));

        let success: boolean;
        await act(async () => {
            success = await result.current.acknowledge();
        });

        expect(success!).toBe(true);
        expect(mockIncidentService.acknowledge).toHaveBeenCalledWith('inc-1');
    });

    it('addLog should call service with correct params', async () => {
        mockIncidentService.addLog.mockResolvedValue({});

        const { result } = renderHook(() => useIncident('inc-1'));
        await waitFor(() => expect(result.current.loading).toBe(false));

        let success: boolean;
        await act(async () => {
            success = await result.current.addLog('analysis', 'Root cause found');
        });

        expect(success!).toBe(true);
        expect(mockIncidentService.addLog).toHaveBeenCalledWith('inc-1', {
            logType: 'analysis',
            rawLog: 'Root cause found',
        });
    });

    it('refresh should re-fetch the incident', async () => {
        const { result } = renderHook(() => useIncident('inc-1'));
        await waitFor(() => expect(result.current.loading).toBe(false));

        const updatedIncident = { ...mockIncident, status: 'RESOLVED' };
        mockIncidentService.getById.mockResolvedValueOnce(updatedIncident);

        await act(async () => {
            await result.current.refresh();
        });

        expect(result.current.incident).toEqual(updatedIncident);
    });
});
