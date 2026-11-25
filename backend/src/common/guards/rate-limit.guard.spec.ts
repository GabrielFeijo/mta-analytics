import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../../database/redis.service';
import { RateLimitOptions } from '../decorators/rate-limit.decorator';
import { RateLimitGuard } from './rate-limit.guard';

function createContext(ip: string, path: string): ExecutionContext {
    const handler = () => {};
    class DummyController {}
    return {
        getHandler: () => handler,
        getClass: () => DummyController,
        switchToHttp: () => ({
            getRequest: () => ({
                method: 'POST',
                ip,
                path,
                url: path,
                route: { path },
            }),
        }),
    } as unknown as ExecutionContext;
}

describe('RateLimitGuard', () => {
    it('uses atomic incrementWithTtl and throws 429 once limit is exceeded', async () => {
        const counters = new Map<string, number>();
        const fakeReflector = {
            getAllAndOverride: (): RateLimitOptions => ({ limit: 2, ttlSeconds: 60 }),
        } as unknown as Reflector;
        const fakeRedis = {
            incrementWithTtl: async (key: string) => {
                const next = (counters.get(key) || 0) + 1;
                counters.set(key, next);
                return next;
            },
        } as unknown as RedisService;

        const guard = new RateLimitGuard(fakeReflector, fakeRedis);
        const ctx = createContext('10.0.0.1', '/auth/login');

        assert.equal(await guard.canActivate(ctx), true);
        assert.equal(await guard.canActivate(ctx), true);

        await assert.rejects(
            () => guard.canActivate(ctx),
            (err: unknown) =>
                err instanceof HttpException && err.getStatus() === HttpStatus.TOO_MANY_REQUESTS,
        );
    });

    it('falls back cleanly to memory counters when Redis throws', async () => {
        const fakeReflector = {
            getAllAndOverride: (): RateLimitOptions => ({ limit: 1, ttlSeconds: 60 }),
        } as unknown as Reflector;
        const brokenRedis = {
            incrementWithTtl: async () => {
                throw new Error('Redis offline');
            },
        } as unknown as RedisService;

        const guard = new RateLimitGuard(fakeReflector, brokenRedis);
        const ctx = createContext('10.0.0.2', '/auth/login');

        assert.equal(await guard.canActivate(ctx), true);
        await assert.rejects(() => guard.canActivate(ctx), HttpException);
    });
});
