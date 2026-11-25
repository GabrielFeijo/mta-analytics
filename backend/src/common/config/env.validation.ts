import { Logger } from '@nestjs/common';

const INSECURE_DEFAULTS = new Set([
    'your-super-secret-jwt-key-change-this-in-production',
    'your-super-secret-hmac-key-change-this',
    'your-super-secret-hmac-key-change-this-in-production',
]);

const MIN_SECRET_LENGTH = 16;

export interface CorsSettings {
    origin: string[] | string;
    credentials: boolean;
}

/**
 * Resolves safe CORS settings for both HTTP and Socket.IO gateways.
 * Never combines wildcard '*' origin with credentials: true.
 */
export function resolveCorsSettings(rawOrigin?: string, nodeEnv?: string): CorsSettings {
    const trimmed = rawOrigin?.trim();
    if (!trimmed) {
        return { origin: ['http://localhost:5173'], credentials: true };
    }
    if (trimmed === '*') {
        if (nodeEnv === 'production') {
            new Logger('CorsConfig').warn(
                'CORS_ORIGIN="*" disables credentialed requests; specify explicit origins in production.',
            );
        }
        return { origin: '*', credentials: false };
    }
    const origins = trimmed
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    return {
        origin: origins.length > 0 ? origins : ['http://localhost:5173'],
        credentials: true,
    };
}

function assertPositiveIntegerIfPresent(config: Record<string, unknown>, key: string): void {
    const raw = config[key];
    if (raw === undefined || raw === null || String(raw).trim() === '') {
        return;
    }
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`Invalid positive integer for environment variable ${key}: "${String(raw)}"`);
    }
}

/**
 * Validates required environment variables on bootstrap and rejects unsafe defaults in production.
 */
export function validateEnvironment(
    config: Record<string, unknown> = process.env,
): Record<string, unknown> {
    const logger = new Logger('EnvValidation');
    const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'MTA_API_KEYS', 'MTA_SECRET'];
    const missing = requiredVars.filter((key) => !String(config[key] ?? '').trim());

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    assertPositiveIntegerIfPresent(config, 'PORT');
    assertPositiveIntegerIfPresent(config, 'REDIS_PORT');
    assertPositiveIntegerIfPresent(config, 'EVENT_RETENTION_DAYS');

    const isProd = config.NODE_ENV === 'production';
    const weakSecrets = ['JWT_SECRET', 'MTA_SECRET'].filter((key) => {
        const value = String(config[key] ?? '').trim();
        return INSECURE_DEFAULTS.has(value) || value.length < MIN_SECRET_LENGTH;
    });

    if (weakSecrets.length > 0) {
        const message = `Weak or default secret detected for: ${weakSecrets.join(', ')} (min ${MIN_SECRET_LENGTH} chars)`;
        if (isProd) {
            throw new Error(message);
        }
        logger.warn(`${message} (allowed only outside production)`);
    }

    return config;
}
