import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../database/redis.service';
import { AuthService, hashToken, parseDurationToMs } from './auth.service';

describe('AuthService', () => {
    it('parses JWT duration expressions accurately', () => {
        assert.equal(parseDurationToMs('15m', 1000), 15 * 60 * 1000);
        assert.equal(parseDurationToMs('2h', 1000), 2 * 60 * 60 * 1000);
        assert.equal(parseDurationToMs('7d', 1000), 7 * 24 * 60 * 60 * 1000);
        assert.equal(parseDurationToMs('90', 1000), 90 * 1000);
        assert.equal(parseDurationToMs('invalid', 5000), 5000);
    });

    it('hashes tokens deterministically and avoids duplicate session keys on concurrent logins', async () => {
        const passwordHash = await bcrypt.hash('secret123', 4);
        const storedSessionTokens: string[] = [];
        let storedExpiresAt: Date | undefined;

        const fakePrisma = {
            admin: {
                findUnique: async () => ({
                    id: 1,
                    username: 'Admin',
                    email: 'admin@garage.rp',
                    password: passwordHash,
                    role: Role.ADMIN,
                }),
            },
            session: {
                create: async (args: { data: { token: string; expiresAt: Date } }) => {
                    storedSessionTokens.push(args.data.token);
                    storedExpiresAt = args.data.expiresAt;
                    return { id: 's1', ...args.data };
                },
            },
        } as unknown as PrismaService;

        const fakeJwt = {
            sign: (payload: Record<string, unknown>) =>
                `jwt.${payload.sub}.${String(payload.jti)}`,
        } as unknown as JwtService;

        const fakeRedis = {
            set: async () => undefined,
        } as unknown as RedisService;

        const fakeConfig = {
            get: (key: string) => (key === 'JWT_EXPIRES_IN' ? '1h' : undefined),
        } as unknown as ConfigService;

        const service = new AuthService(fakePrisma, fakeJwt, fakeRedis, fakeConfig);
        const before = Date.now();
        const first = await service.login(' ADMIN@garage.rp ', 'secret123');
        const second = await service.login('admin@garage.rp', 'secret123');

        assert.notEqual(first.access_token, second.access_token);
        assert.equal(storedSessionTokens.length, 2);
        assert.notEqual(storedSessionTokens[0], storedSessionTokens[1]);
        assert.equal(storedSessionTokens[0], hashToken(first.access_token));
        assert.ok(storedExpiresAt);
        assert.ok(storedExpiresAt.getTime() - before <= 60 * 60 * 1000 + 2000);
    });

    it('notifies revocation listeners immediately on logout', async () => {
        const revokedHashes: string[] = [];
        const fakePrisma = {
            session: {
                deleteMany: async () => ({ count: 1 }),
            },
        } as unknown as PrismaService;
        const fakeJwt = {
            decode: () => ({ exp: Math.floor(Date.now() / 1000) + 300 }),
        } as unknown as JwtService;
        const fakeRedis = {
            pipeline: () => ({
                setex: () => undefined,
                del: () => undefined,
                exec: async () => [],
            }),
        } as unknown as RedisService;
        const fakeConfig = { get: () => undefined } as unknown as ConfigService;

        const service = new AuthService(fakePrisma, fakeJwt, fakeRedis, fakeConfig);
        const unsubscribe = service.onTokenRevoked((hash) => revokedHashes.push(hash));

        await service.logout('sample.jwt.token');
        assert.deepEqual(revokedHashes, [hashToken('sample.jwt.token')]);
        unsubscribe();
    });
});
