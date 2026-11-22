import { Logger } from '@nestjs/common';

const INSECURE_DEFAULTS = new Set([
    'your-super-secret-jwt-key-change-this-in-production',
    'your-super-secret-hmac-key-change-this',
    'your-super-secret-hmac-key-change-this-in-production',
]);

/**
 * Validates required environment variables on bootstrap and rejects unsafe defaults in production.
 */
export function validateEnvironment(): void {
    const logger = new Logger('EnvValidation');
    const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'MTA_API_KEYS', 'MTA_SECRET'];
    const missing = requiredVars.filter((key) => !process.env[key]?.trim());

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    const isProd = process.env.NODE_ENV === 'production';
    const weakSecrets = ['JWT_SECRET', 'MTA_SECRET'].filter((key) =>
        INSECURE_DEFAULTS.has(process.env[key] || ''),
    );

    if (weakSecrets.length > 0) {
        const message = `Default/weak secret detected for: ${weakSecrets.join(', ')}`;
        if (isProd) {
            throw new Error(message);
        }
        logger.warn(`${message} (allowed only outside production)`);
    }
}
