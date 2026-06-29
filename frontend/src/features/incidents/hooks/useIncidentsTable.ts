import { useState, useCallback } from 'react';
import { incidentService } from '../api/incident.service';
import { useToast } from '../../../components/ui/Toast';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import type { Incident } from '../../../types';

export function useIncidentsTable(incidents: Incident[], refresh: () => Promise<void>) {
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkLoading, setBulkLoading] = useState(false);
    const toast = useToast();
    const { confirm } = useConfirm();

    const allIds = incidents.map(i => i.id);
    const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
    const someSelected = selected.size > 0;

    const toggleOne = useCallback((id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const toggleAll = useCallback(() => {
        setSelected(allSelected ? new Set() : new Set(allIds));
    }, [allSelected, allIds]);

    const clearSelection = useCallback(() => setSelected(new Set()), []);

    const bulkUpdateStatus = async (status: string) => {
        const ids = [...selected];
        if (!await confirm(`Set ${ids.length} incident(s) to "${status}"?`, 'This will update all selected incidents.', 'danger')) return;
        
        setBulkLoading(true);
        let ok = 0;
        for (const id of ids) {
            try {
                await incidentService.updateStatus(id, status);
                ok++;
            } catch { /* skip */ }
        }
        
        toast.success(`Updated ${ok} of ${ids.length} incidents to "${status}"`);
        clearSelection();
        await refresh();
        setBulkLoading(false);
    };

    const bulkDelete = async () => {
        const ids = [...selected];
        if (!await confirm(`Delete ${ids.length} incident(s)?`, 'This action cannot be undone.', 'danger')) return;
        
        setBulkLoading(true);
        let ok = 0;
        for (const id of ids) {
            try {
                await incidentService.delete(id);
                ok++;
            } catch { /* skip */ }
        }
        
        toast.success(`Deleted ${ok} of ${ids.length} incidents`);
        clearSelection();
        await refresh();
        setBulkLoading(false);
    };

    const handleDelete = async (id: string, title: string) => {
        if (!await confirm(`Delete incident "${title}"?`, 'This action cannot be undone.', 'danger')) return;
        try {
            await incidentService.delete(id);
            toast.success('Incident deleted');
            setSelected(prev => {
                const n = new Set(prev);
                n.delete(id);
                return n;
            });
            await refresh();
        } catch {
            toast.error('Failed to delete incident');
        }
    };

    return {
        selected,
        bulkLoading,
        allSelected,
        someSelected,
        toggleOne,
        toggleAll,
        clearSelection,
        bulkUpdateStatus,
        bulkDelete,
        handleDelete
    };
}
