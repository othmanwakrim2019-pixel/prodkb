import { ValidationError } from '../../../../common/errors/app.error';
import type { AuthRequest } from '../../../../common/middleware/auth.middleware';

export const requireAuthenticatedUserId = (req: AuthRequest) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new ValidationError('User not authenticated');
    }

    return userId;
};

export const validateSafeFilename = (filename: string) => {
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        throw new ValidationError('Invalid filename: path traversal characters are not allowed');
    }
};
