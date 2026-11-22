import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { ApiKeyGuard } from './api-key.guard';

function createMockConfig(overrides: Record<string, string> = {}): ConfigService {
    const values: Record<string, string> = {
        MTA_API_KEYS: 'mta-server-key-1,mta-server-key-2',
        MTA_SECRET: 'super-secret-key-for-tests',
        ...overrides,
    };
    return {
        get: (key: string) => values[key],
    } as unknown as ConfigService;
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
    it('accepts valid HMAC-SHA256 signature and attaches serverId', () => {
        const guard = new ApiKeyGuard(createMockConfig());
        const timestamp = String(Date.now());
        const rawBody = JSON.stringify({ events: [{ eventType: 'player_join' }] });
        const hmac = signPayload('super-secret-key-for-tests', timestamp, rawBody);

        const request: Record<string, any> = {
            headers: {
                'x-api-key': 'mta-server-key-1',
                'x-timestamp': timestamp,
                'x-hmac-signature': hmac,
            },
            rawBody: Buffer.from(rawBody, 'utf8'),
        };

        const allowed = guard.canActivate(createMockContext(request));
        assert.equal(allowed, true);
        assert.equal(request.serverId, 'mta-server-key-1');
    });

    it('rejects tampered body / invalid HMAC signature', () => {
        const guard = new ApiKeyGuard(createMockConfig());
        const timestamp = String(Date.now());
        const hmac = signPayload('super-secret-key-for-tests', timestamp, '{"events":[]}');

        const request: Record<string, any> = {
            headers: {
                'x-api-key': 'mta-server-key-1',
                'x-timestamp': timestamp,
                'x-hmac-signature': hmac,
            },
            rawBody: Buffer.from('{"events":[{"tampered":true}]}', 'utf8'),
        };

        assert.throws(() => guard.canActivate(createMockContext(request)), UnauthorizedException);
    });

    it('rejects expired timestamps outside the 5-minute anti-replay window', () => {
        const guard = new ApiKeyGuard(createMockConfig());
        const expiredTimestamp = String(Date.now() - 6 * 60 * 1000);
        const rawBody = '{}';
        const hmac = signPayload('super-secret-key-for-tests', expiredTimestamp, rawBody);

        const request: Record<string, any> = {
            headers: {
                'x-api-key': 'mta-server-key-1',
                'x-timestamp': expiredTimestamp,
                'x-hmac-signature': hmac,
            },
            rawBody: Buffer.from(rawBody, 'utf8'),
        };

        assert.throws(() => guard.canActivate(createMockContext(request)), UnauthorizedException);
    });

    it('rejects unknown API keys', () => {
        const guard = new ApiKeyGuard(createMockConfig());
        const timestamp = String(Date.now());
        const rawBody = '{}';
        const hmac = signPayload('super-secret-key-for-tests', timestamp, rawBody);

        const request: Record<string, any> = {
            headers: {
                'x-api-key': 'rogue-server-key',
                'x-timestamp': timestamp,
                'x-hmac-signature': hmac,
            },
            rawBody: Buffer.from(rawBody, 'utf8'),
        };

        assert.throws(() => guard.canActivate(createMockContext(request)), UnauthorizedException);
    });
});
