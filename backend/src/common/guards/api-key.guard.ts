import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Optional,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as crypto from 'crypto';
import { RedisService } from '../../database/redis.service';

const MAX_TIMESTAMP_SKEW_MS = 5 * 60 * 1000;
const REPLAY_TTL_SECONDS = Math.ceil(MAX_TIMESTAMP_SKEW_MS / 1000) + 10;
const MAX_MEMORY_REPLAY_ENTRIES = 10_000;

export interface ConfiguredApiKey {
    serverId: string;
    apiKey: string;
}

type RawBodyRequest = Request & {
    rawBody?: Buffer | string;
    serverId?: string;
};

/**
 * Parses `MTA_API_KEYS` entries supporting either `serverId:apiKey` pairs or legacy plain keys.
 * Legacy plain keys are hashed into a non-secret `srv_<hex>` identifier so secrets never leak.
 */
export function parseConfiguredApiKeys(rawKeys: string): ConfiguredApiKey[] {
    return rawKeys
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => {
            const sepIndex = entry.indexOf(':');
            if (sepIndex > 0 && sepIndex < entry.length - 1) {
                const serverId = entry.slice(0, sepIndex).trim();
                const apiKey = entry.slice(sepIndex + 1).trim();
                if (serverId && apiKey) {
                    return { serverId, apiKey };
                }
            }
            const digest = crypto.createHash('sha256').update(entry).digest('hex').slice(0, 8);
            return { serverId: `srv_${digest}`, apiKey: entry };
        });
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
    private readonly memoryReplayCache = new Map<string, number>();

    constructor(
        private readonly configService: ConfigService,
        @Optional() private readonly redis?: RedisService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<RawBodyRequest>();

        const apiKey = this.readHeader(request.headers['x-api-key']);
        const hmacSignature = this.readHeader(request.headers['x-hmac-signature']);
        const timestampRaw = this.readHeader(request.headers['x-timestamp']);

        if (!apiKey || !hmacSignature || !timestampRaw) {
            throw new UnauthorizedException('Missing security headers');
        }

        if (!this.isTimestampFresh(timestampRaw)) {
            throw new UnauthorizedException('Request timestamp expired or invalid');
        }

        const matchedKey = this.matchApiKey(apiKey);
        if (!matchedKey) {
            throw new UnauthorizedException('Invalid API key');
        }

        const rawBody = this.resolveRawBody(request);
        const secret = this.configService.get<string>('MTA_SECRET') || '';
        const expectedHmac = crypto
            .createHmac('sha256', secret)
            .update(`${timestampRaw}.${rawBody}`)
            .digest('hex');

        if (!this.safeHexEquals(hmacSignature, expectedHmac)) {
            throw new UnauthorizedException('Invalid HMAC signature');
        }

        const isFreshNonce = await this.claimReplayNonce(matchedKey.serverId, hmacSignature);
        if (!isFreshNonce) {
            throw new UnauthorizedException('Replay request detected');
        }

        request.serverId = matchedKey.serverId;
        return true;
    }

    private readHeader(value: string | string[] | undefined): string {
        if (Array.isArray(value)) {
            return (value[0] || '').trim();
        }
        return typeof value === 'string' ? value.trim() : '';
    }

    private isTimestampFresh(timestampRaw: string): boolean {
        const timestampMs = Number(timestampRaw);
        if (!Number.isFinite(timestampMs) || timestampMs <= 0) {
            return false;
        }
        return Math.abs(Date.now() - timestampMs) <= MAX_TIMESTAMP_SKEW_MS;
    }

    private matchApiKey(providedKey: string): ConfiguredApiKey | null {
        const rawKeys = this.configService.get<string>('MTA_API_KEYS') || '';
        const candidates = parseConfiguredApiKeys(rawKeys);
        const providedBuf = Buffer.from(providedKey, 'utf8');

        let matched: ConfiguredApiKey | null = null;
        for (const candidate of candidates) {
            const candidateBuf = Buffer.from(candidate.apiKey, 'utf8');
            if (
                providedBuf.length === candidateBuf.length &&
                crypto.timingSafeEqual(providedBuf, candidateBuf)
            ) {
                matched = candidate;
            }
        }
        return matched;
    }

    private async claimReplayNonce(serverId: string, hmacSignature: string): Promise<boolean> {
        const replayKey = `mta:replay:${serverId}:${hmacSignature.toLowerCase()}`;
        if (this.redis) {
            try {
                return await this.redis.setNxEx(replayKey, '1', REPLAY_TTL_SECONDS);
            } catch {
                // Fall back to bounded local replay map if Redis is temporarily unavailable
            }
        }

        const now = Date.now();
        if (this.memoryReplayCache.size >= 1000) {
            this.pruneMemoryReplayCache(now);
        }

        const existingExpiry = this.memoryReplayCache.get(replayKey);
        if (existingExpiry !== undefined && existingExpiry > now) {
            return false;
        }

        if (this.memoryReplayCache.size >= MAX_MEMORY_REPLAY_ENTRIES) {
            const oldestKey = this.memoryReplayCache.keys().next().value;
            if (oldestKey) {
                this.memoryReplayCache.delete(oldestKey);
            }
        }

        this.memoryReplayCache.set(replayKey, now + REPLAY_TTL_SECONDS * 1000);
        return true;
    }

    private pruneMemoryReplayCache(now: number): void {
        for (const [key, expiresAt] of this.memoryReplayCache.entries()) {
            if (expiresAt <= now) {
                this.memoryReplayCache.delete(key);
            }
        }
    }

    private resolveRawBody(request: RawBodyRequest): string {
        if (Buffer.isBuffer(request.rawBody)) {
            return request.rawBody.toString('utf8');
        }
        if (typeof request.rawBody === 'string') {
            return request.rawBody;
        }
        return request.body ? JSON.stringify(request.body) : '';
    }

    private safeHexEquals(provided: string, expected: string): boolean {
        const providedBuf = Buffer.from(provided.toLowerCase(), 'utf8');
        const expectedBuf = Buffer.from(expected.toLowerCase(), 'utf8');
        if (providedBuf.length !== expectedBuf.length) {
            return false;
        }
        return crypto.timingSafeEqual(providedBuf, expectedBuf);
    }
}
