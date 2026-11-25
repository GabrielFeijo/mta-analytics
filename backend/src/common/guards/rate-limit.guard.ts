import {
    CanActivate,
    ExecutionContext,
    HttpException,
    HttpStatus,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { RedisService } from '../../database/redis.service';
import { RATE_LIMIT_KEY, RateLimitOptions } from '../decorators/rate-limit.decorator';

interface MemoryCounter {
    count: number;
    expiresAt: number;
}

const MAX_MEMORY_RATE_LIMIT_ENTRIES = 10_000;

@Injectable()
export class RateLimitGuard implements CanActivate {
    private readonly memoryFallback = new Map<string, MemoryCounter>();

    constructor(
        private readonly reflector: Reflector,
        private readonly redis: RedisService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const options = this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!options) {
            return true;
        }

        const request = context.switchToHttp().getRequest<Request>();
        const ip = String(request.ip || request.socket?.remoteAddress || 'unknown');
        const routePath =
            (request.route as { path?: string } | undefined)?.path || request.path || request.url;
        const route = `${request.method}:${routePath}`;
        const key = `ratelimit:${route}:${ip}`;

        const count = await this.incrementCounter(key, options.ttlSeconds);
        if (count > options.limit) {
            throw new HttpException(
                'Muitas tentativas em curto intervalo. Aguarde antes de tentar novamente.',
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }
        return true;
    }

    private async incrementCounter(key: string, ttlSeconds: number): Promise<number> {
        try {
            return await this.redis.incrementWithTtl(key, ttlSeconds);
        } catch {
            const now = Date.now();
            if (this.memoryFallback.size >= 1000) {
                this.pruneExpired(now);
            }

            const existing = this.memoryFallback.get(key);
            if (!existing || existing.expiresAt <= now) {
                if (this.memoryFallback.size >= MAX_MEMORY_RATE_LIMIT_ENTRIES) {
                    const oldestKey = this.memoryFallback.keys().next().value;
                    if (oldestKey) {
                        this.memoryFallback.delete(oldestKey);
                    }
                }
                this.memoryFallback.set(key, {
                    count: 1,
                    expiresAt: now + ttlSeconds * 1000,
                });
                return 1;
            }
            existing.count += 1;
            return existing.count;
        }
    }

    private pruneExpired(now: number): void {
        for (const [entryKey, entry] of this.memoryFallback.entries()) {
            if (entry.expiresAt <= now) {
                this.memoryFallback.delete(entryKey);
            }
        }
    }
}
