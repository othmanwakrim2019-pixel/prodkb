
import jwt from 'jsonwebtoken';
import { env } from '../../config/env'; // Will update path later or move config
import { AppError } from '../errors/app.error';

export interface JwtPayloadWithUser extends jwt.JwtPayload {
    userId: string;
    email: string;
    role: string;
}

export class JwtService {
    static sign(payload: object, expiresIn: string | number = '15m'): string {
        return jwt.sign(payload, env.JWT_SECRET, { expiresIn, algorithm: 'HS256' } as jwt.SignOptions);
    }

    static verify(token: string): JwtPayloadWithUser {
        try {
            return jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as JwtPayloadWithUser;
        } catch (error) {
            throw new AppError('Invalid or expired token', 401, 'INVALID_TOKEN');
        }
    }
}

