/**
 * Account Lockout Service — Prevents Distributed Credential Stuffing
 * Tracks failed login attempts per email (not per IP) using Redis.
 * Locks accounts after MAX_ATTEMPTS failed logins for LOCKOUT_DURATION.
 * @module common/services/lockout.service
 */

import { redis } from '../utils/redis';
import { logger } from '../utils/logger';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_SECONDS = 15 * 60; // 15 minutes
const KEY_PREFIX = 'lockout:';

function getKey(email: string): string {
    return `${KEY_PREFIX}${email.toLowerCase().trim()}`;
}

/**
 * Check if an account is currently locked out.
 * @returns remaining lockout time in seconds, or 0 if not locked
 */
export async function isAccountLocked(email: string): Promise<number> {
    try {
        const key = getKey(email);
        const attempts = await redis.get(key);
        if (attempts && parseInt(attempts) >= MAX_ATTEMPTS) {
            const ttl = await redis.ttl(key);
            return ttl > 0 ? ttl : 0;
        }
        return 0;
    } catch (error) {
        logger.warn('Lockout check failed (Redis may be down), allowing login', { error });
        return 0; // Fail-open: don't lock out users if Redis is down
    }
}

/**
 * Record a failed login attempt. If the threshold is reached, the account
 * becomes locked for LOCKOUT_DURATION.
 */
export async function recordFailedAttempt(email: string): Promise<{ locked: boolean; attemptsLeft: number }> {
    try {
        const key = getKey(email);
        const current = await redis.incr(key);

        // Set the expiry on the first attempt so it auto-resets
        if (current === 1) {
            await redis.expire(key, LOCKOUT_DURATION_SECONDS);
        }

        const attemptsLeft = Math.max(0, MAX_ATTEMPTS - current);
        const locked = current >= MAX_ATTEMPTS;

        if (locked) {
            // Ensure the lockout timer is set from now
            await redis.expire(key, LOCKOUT_DURATION_SECONDS);
            logger.warn('Account locked due to too many failed attempts', { email, attempts: current });
        }

        return { locked, attemptsLeft };
    } catch (error) {
        logger.warn('Failed to record lockout attempt (Redis may be down)', { error });
        return { locked: false, attemptsLeft: MAX_ATTEMPTS };
    }
}

/**
 * Clear failed attempts on successful login.
 */
export async function clearFailedAttempts(email: string): Promise<void> {
    try {
        await redis.del(getKey(email));
    } catch (error) {
        logger.warn('Failed to clear lockout counter', { error });
    }
}
