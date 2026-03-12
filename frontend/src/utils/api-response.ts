const DEFAULT_ARRAY_KEYS = ['data', 'items', 'results'];
const DEFAULT_OBJECT_KEYS = ['data', 'item', 'result'];

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

export const unwrapArray = <T>(payload: unknown, keys: string[] = DEFAULT_ARRAY_KEYS): T[] => {
    if (Array.isArray(payload)) {
        return payload as T[];
    }

    if (!isRecord(payload)) {
        return [];
    }

    for (const key of keys) {
        const value = payload[key];
        if (Array.isArray(value)) {
            return value as T[];
        }
    }

    return [];
};

export const unwrapObject = <T>(payload: unknown, keys: string[] = DEFAULT_OBJECT_KEYS): T | null => {
    if (isRecord(payload)) {
        for (const key of keys) {
            const value = payload[key];
            if (isRecord(value)) {
                return value as T;
            }
        }

        return payload as T;
    }

    return null;
};
