
import winston from 'winston';
import { getRequestContext } from './request-context';

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const level = () => {
    if (process.env.LOG_LEVEL) return process.env.LOG_LEVEL;
    const env = process.env.NODE_ENV || 'development';
    return env === 'development' ? 'debug' : 'warn';
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

winston.addColors(colors);

// ── Request context injection ──
// Auto-injects requestId, userId, method, path from AsyncLocalStorage
const requestContextFormat = winston.format((info) => {
    const ctx = getRequestContext();
    if (ctx) {
        info.requestId = ctx.requestId;
        if (ctx.userId) info.userId = ctx.userId;
        if (ctx.method) info.method = ctx.method;
        if (ctx.path) info.path = ctx.path;
    }
    return info;
});

// ── Development format: colorized, human-readable ──
const devFormat = winston.format.combine(
    requestContextFormat(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf((info) => {
        const ctx = info.requestId ? ` [${info.requestId}]` : '';
        return `${info.timestamp} ${info.level}:${ctx} ${info.message}`;
    }),
);

// ── Production format: structured JSON (parseable by ELK/Datadog/CloudWatch) ──
const prodFormat = winston.format.combine(
    requestContextFormat(),
    winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
);

const isProduction = process.env.NODE_ENV === 'production';

const transports = [
    new winston.transports.Console({
        format: isProduction ? prodFormat : devFormat,
    }),
    new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(
            requestContextFormat(),
            winston.format.uncolorize(),
            winston.format.timestamp(),
            winston.format.json(),
        ),
    }),
    new winston.transports.File({
        filename: 'logs/all.log',
        format: winston.format.combine(
            requestContextFormat(),
            winston.format.uncolorize(),
            winston.format.timestamp(),
            winston.format.json(),
        ),
    }),
];

export const logger = winston.createLogger({
    level: level(),
    levels,
    transports,
});

