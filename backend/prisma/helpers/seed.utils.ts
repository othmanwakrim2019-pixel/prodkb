/**
 * Seed Utilities — shared helpers for all seed files
 * @module prisma/helpers/seed.utils
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// Shared Prisma client for all seed files
export const prisma = new PrismaClient();

// Pre-hashed password for seed users (password123)
let _hashedPassword: string | null = null;
export async function getHashedPassword(): Promise<string> {
    if (!_hashedPassword) {
        _hashedPassword = await bcrypt.hash('password123', 10);
    }
    return _hashedPassword;
}

/**
 * Log a seed action (created or skipped)
 */
export function logSeed(entity: string, name: string, created: boolean): void {
    const icon = created ? '✅' : '⏭️';
    const action = created ? 'Created' : 'Already exists';
    console.log(`  ${icon} ${entity}: ${name} — ${action}`);
}

/**
 * Disconnect Prisma client — call once at the end of seeding
 */
export async function disconnect(): Promise<void> {
    await prisma.$disconnect();
}
