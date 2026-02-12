
export interface ApiResponse<T = any> {
    success: boolean;
    data: T | null;
    message?: string;
    timestamp: string;
    path?: string;
    error?: {
        code: string;
        details?: any;
    };
}

export const createResponse = <T>(
    success: boolean,
    data: T | null = null,
    message?: string,
    error?: { code: string; details?: any }
): ApiResponse<T> => {
    return {
        success,
        data,
        message,
        timestamp: new Date().toISOString(),
        error,
    };
};
