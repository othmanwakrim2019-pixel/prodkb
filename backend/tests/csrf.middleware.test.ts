import type { NextFunction, Request, Response } from 'express';
import {
    clearCsrfCookie,
    csrfProtection,
    generateCsrfToken,
    setCsrfCookie,
} from '../src/common/middleware/csrf.middleware';

jest.mock('../src/common/utils/logger', () => ({
    logger: {
        warn: jest.fn(),
    },
}));

const createResponse = () => {
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        cookie: jest.fn().mockReturnThis(),
        clearCookie: jest.fn().mockReturnThis(),
    };

    return res as unknown as Response;
};

const createRequest = (overrides: Partial<Request>): Request => ({
    method: 'POST',
    path: '/incidents',
    originalUrl: '/incidents',
    cookies: {},
    headers: {},
    ...overrides,
} as Request);

describe('csrfProtection', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('skips safe HTTP methods', () => {
        const req = createRequest({ method: 'GET' });
        const res = createResponse();
        const next = jest.fn() as NextFunction;

        csrfProtection(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('rejects requests with missing tokens', () => {
        const req = createRequest({});
        const res = createResponse();
        const next = jest.fn() as NextFunction;

        csrfProtection(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            error: { code: 'CSRF_MISSING' },
        }));
    });

    it('rejects mismatched token lengths without throwing', () => {
        const req = createRequest({
            cookies: { csrf_token: 'short' },
            headers: { 'x-csrf-token': 'a-longer-token' },
        });
        const res = createResponse();
        const next = jest.fn() as NextFunction;

        expect(() => csrfProtection(req, res, next)).not.toThrow();
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            error: { code: 'CSRF_INVALID' },
        }));
    });

    it('allows requests with matching CSRF tokens', () => {
        const token = generateCsrfToken();
        const req = createRequest({
            cookies: { csrf_token: token },
            headers: { 'x-csrf-token': token },
        });
        const res = createResponse();
        const next = jest.fn() as NextFunction;

        csrfProtection(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });
});

describe('CSRF cookie helpers', () => {
    it('sets and clears the CSRF cookie with matching options', () => {
        const res = createResponse();
        const token = generateCsrfToken();

        setCsrfCookie(res, token);
        clearCsrfCookie(res);

        expect(res.cookie).toHaveBeenCalledWith('csrf_token', token, expect.objectContaining({
            httpOnly: false,
            sameSite: 'strict',
            path: '/',
        }));
        expect(res.clearCookie).toHaveBeenCalledWith('csrf_token', expect.objectContaining({
            httpOnly: false,
            sameSite: 'strict',
            path: '/',
        }));
    });
});
