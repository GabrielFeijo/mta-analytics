import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { resolveCorsSettings, validateEnvironment } from './env.validation';

describe('env.validation', () => {
    it('validates complete production configuration with strong secrets', () => {
        const config = {
            NODE_ENV: 'production',
            DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
            JWT_SECRET: 'prod-jwt-secret-with-more-than-16-chars',
            MTA_API_KEYS: 'main:prod-mta-api-key-01',
            MTA_SECRET: 'prod-hmac-secret-with-more-than-16-chars',
            PORT: '3000',
            REDIS_PORT: '6379',
            EVENT_RETENTION_DAYS: '14',
        };

        const validated = validateEnvironment(config);
        assert.equal(validated.PORT, '3000');
    });

    it('rejects weak or default secrets in production', () => {
        assert.throws(() =>
            validateEnvironment({
                NODE_ENV: 'production',
                DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
                JWT_SECRET: 'short',
                MTA_API_KEYS: 'key-1',
                MTA_SECRET: 'prod-hmac-secret-with-more-than-16-chars',
            }),
        );

        assert.throws(() =>
            validateEnvironment({
                NODE_ENV: 'production',
                DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
                JWT_SECRET: 'your-super-secret-jwt-key-change-this-in-production',
                MTA_API_KEYS: 'key-1',
                MTA_SECRET: 'prod-hmac-secret-with-more-than-16-chars',
            }),
        );
    });

    it('rejects invalid numeric ports', () => {
        assert.throws(() =>
            validateEnvironment({
                NODE_ENV: 'development',
                DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
                JWT_SECRET: 'dev-secret-over-16-characters',
                MTA_API_KEYS: 'key-1',
                MTA_SECRET: 'dev-hmac-secret-over-16-characters',
                PORT: 'not-a-number',
            }),
        );
    });

    it('never enables credentials together with wildcard CORS origin', () => {
        const wildcard = resolveCorsSettings('*', 'development');
        assert.equal(wildcard.origin, '*');
        assert.equal(wildcard.credentials, false);

        const explicit = resolveCorsSettings('https://panel.rp.gg, http://localhost:5173', 'production');
        assert.deepEqual(explicit.origin, ['https://panel.rp.gg', 'http://localhost:5173']);
        assert.equal(explicit.credentials, true);
    });
});
