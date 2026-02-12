
import jwt from 'jsonwebtoken';
import { env } from '../../config/env'; // Will update path later or move config
import { AppError } from '../errors/app.error';

export class JwtService {
    static sign(payload: object, expiresIn: string | number = '24h'): string {
        return jwt.sign(payload, env.JWT_SECRET, { expiresIn } as jwt.SignOptions);
    }

    static verify(token: string): any {
        try {
            return jwt.verify(token, env.JWT_SECRET);
        } catch (error) {
            throw new AppError('Invalid or expired token', 401, 'INVALID_TOKEN');
        }
    }
}
