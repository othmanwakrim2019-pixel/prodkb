
export interface ApiResponse<T = unknown> {
    success: boolean;
    data: T | null;
    message?: string;
    timestamp: string;
    path?: string;
    error?: {
        code: string;
        details?: unknown;
    };
}

export const createResponse = <T>(
    success: boolean,
    data: T | null = null,
    message?: string,
    error?: { code: string; details?: unknown }
): ApiResponse<T> => {
    return {
        success,
        data,
        message,
        timestamp: new Date().toISOString(),
        error,
    };
};

