/**
 * useFilterPresets — save/load named filter presets to localStorage
 * Presets are stored as: { id, name, params: URLSearchParams-like object }
 */
import { useState, useCallback } from 'react';

export interface FilterPreset {
    id: string;
    name: string;
    params: Record<string, string>;
}

const STORAGE_KEY = 'prodkb_incident_filter_presets';

function loadPresets(): FilterPreset[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveToStorage(presets: FilterPreset[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export function useFilterPresets() {
    const [presets, setPresets] = useState<FilterPreset[]>(loadPresets);

    const savePreset = useCallback((name: string, params: URLSearchParams) => {
        const obj: Record<string, string> = {};
        // Only save meaningful filter params
        const filterKeys = ['search', 'status', 'severity', 'systemId', 'teamId', 'startDate', 'endDate'];
        filterKeys.forEach(k => {
            const v = params.get(k);
            if (v) obj[k] = v;
        });

        if (Object.keys(obj).length === 0) return false;

        const preset: FilterPreset = {
            id: `${Date.now()}`,
            name: name.trim() || `Preset ${Date.now()}`,
            params: obj,
        };
        const next = [preset, ...presets].slice(0, 8); // max 8 presets
        setPresets(next);
        saveToStorage(next);
        return true;
    }, [presets]);

    const deletePreset = useCallback((id: string) => {
        const next = presets.filter(p => p.id !== id);
        setPresets(next);
        saveToStorage(next);
    }, [presets]);

    const applyPreset = useCallback((preset: FilterPreset, setSearchParams: (params: URLSearchParams) => void) => {
        const p = new URLSearchParams(preset.params);
        p.set('page', '1');
        setSearchParams(p);
    }, []);

    return { presets, savePreset, deletePreset, applyPreset };
}
