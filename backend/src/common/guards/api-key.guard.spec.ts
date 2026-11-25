import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { RedisService } from '../../database/redis.service';
import { ApiKeyGuard, parseConfiguredApiKeys } from './api-key.guard';

function createMockConfig(overrides: Record<string, string> = {}): ConfigService {
    const values: Record<string, string> = {
        MTA_API_KEYS: 'garage-main:secret-api-key-1,mta-server-key-2',
        MTA_SECRET: 'super-secret-key-for-tests-1234',
        ...overrides,
    };
    return {
        get: (key: string) => values[key],
    } as unknown as ConfigService;
}

function createMockRedis(): RedisService {
    const seen = new Set<string>();
    return {
        setNxEx: async (key: string) => {
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        },
    } as unknown as RedisService;
}

function createMockContext(request: Record<string, unknown>): ExecutionContext {
    return {
        switchToHttp: () => ({
            getRequest: () => request,
        }),
    } as unknown as ExecutionContext;
}

function signPayload(secret: string, timestamp: string, rawBody: string): string {
    return crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
}

describe('ApiKeyGuard', () => {
    it('maps configured api keys to non-secret server identifiers', () => {
        const parsed = parseConfiguredApiKeys('garage-main:secret-1,legacy-secret-2');
        assert.equal(parsed[0].serverId, 'garage-main');
        assert.equal(parsed[0].apiKey, 'secret-1');
        assert.ok(parsed[1].serverId.startsWith('srv_'));
        assert.notEqual(parsed[1].serverId, 'legacy-secret-2');
    });

    it('accepts valid HMAC-SHA256 signature and attaches non-secret serverId', async () => {
        const guard = new ApiKeyGuard(createMockConfig(), createMockRedis());
        const timestamp = String(Date.now());
        const rawBody = JSON.stringify({ events: [{ eventType: 'player_join' }] });
        const hmac = signPayload('super-secret-key-for-tests-1234', timestamp, rawBody);

        const request: Record<string, unknown> = {
            headers: {
                'x-api-key': 'secret-api-key-1',
                'x-timestamp': timestamp,
                'x-hmac-signature': hmac,
            },
            rawBody: Buffer.from(rawBody, 'utf8'),
        };

        const allowed = await guard.canActivate(createMockContext(request));
        assert.equal(allowed, true);
        assert.equal(request.serverId, 'garage-main');

        // Replaying the exact signed request must fail anti-replay protection
        await assert.rejects(
            () => guard.canActivate(createMockContext(request)),
            UnauthorizedException,
        );
    });

    it('rejects tampered body / invalid HMAC signature', async () => {
        const guard = new ApiKeyGuard(createMockConfig());
        const timestamp = String(Date.now());
        const hmac = signPayload('super-secret-key-for-tests-1234', timestamp, '{"events":[]}');

        const request: Record<string, unknown> = {
            headers: {
                'x-api-key': 'secret-api-key-1',
                'x-timestamp': timestamp,
                'x-hmac-signature': hmac,
            },
            rawBody: Buffer.from('{"events":[{"tampered":true}]}', 'utf8'),
        };

        await assert.rejects(
            () => guard.canActivate(createMockContext(request)),
            UnauthorizedException,
        );
    });

    it('rejects expired timestamps outside the 5-minute anti-replay window', async () => {
        const guard = new ApiKeyGuard(createMockConfig());
        const expiredTimestamp = String(Date.now() - 6 * 60 * 1000);
        const rawBody = '{}';
        const hmac = signPayload('super-secret-key-for-tests-1234', expiredTimestamp, rawBody);

        const request: Record<string, unknown> = {
            headers: {
                'x-api-key': 'secret-api-key-1',
                'x-timestamp': expiredTimestamp,
                'x-hmac-signature': hmac,
            },
            rawBody: Buffer.from(rawBody, 'utf8'),
        };

        await assert.rejects(
            () => guard.canActivate(createMockContext(request)),
            UnauthorizedException,
        );
    });

    it('rejects unknown API keys', async () => {
        const guard = new ApiKeyGuard(createMockConfig());
        const timestamp = String(Date.now());
        const rawBody = '{}';
        const hmac = signPayload('super-secret-key-for-tests-1234', timestamp, rawBody);

        const request: Record<string, unknown> = {
            headers: {
                'x-api-key': 'rogue-server-key',
                'x-timestamp': timestamp,
                'x-hmac-signature': hmac,
            },
            rawBody: Buffer.from(rawBody, 'utf8'),
        };

        await assert.rejects(
            () => guard.canActivate(createMockContext(request)),
            UnauthorizedException,
        );
    });
});
