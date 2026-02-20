import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // ── Required ──
  DATABASE_URL: z.string({ message: 'DATABASE_URL is required. Example: postgresql://user:password@localhost:5432/prodkb' }),
  JWT_SECRET: z.string({ message: 'JWT_SECRET is required. Use a strong random string in production.' })
    .min(16, 'JWT_SECRET must be at least 16 characters for security'),

  // ── Server ──
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),

  // ── Frontend & CORS ──
  FRONTEND_URL: z.string().optional().default('http://localhost:5173'),
  CORS_ORIGINS: z.string().optional().default('http://localhost:5173,http://localhost:3000'),

  // ── Redis ──
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // ── SMTP (all optional — email notifications disabled if SMTP_HOST is missing) ──
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).optional().default(587),
  SMTP_SECURE: z.string().optional().default('true').transform(val => val === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional().default('ProdKB <prodkb@company.com>'),

  // ── S3 / MinIO (optional — falls back to local disk if S3_BUCKET is not set) ──
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional().default('us-east-1'),
  S3_ENDPOINT: z.string().url().optional(),           // e.g. http://localhost:9000 for MinIO
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.string().optional().default('false').transform(val => val === 'true'),
});

export const env = envSchema.parse(process.env);

// Export the inferred type for use elsewhere
export type Env = z.infer<typeof envSchema>;
