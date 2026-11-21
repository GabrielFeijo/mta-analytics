import {
    CanActivate,
    ExecutionContext,
    HttpException,
    HttpStatus,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../../database/redis.service';
import { RATE_LIMIT_KEY, RateLimitOptions } from '../decorators/rate-limit.decorator';

interface MemoryCounter {
    count: number;
    expiresAt: number;
}

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

        const request = context.switchToHttp().getRequest();
        const ip = String(request.ip || request.socket?.remoteAddress || 'unknown');
        const route = `${request.method}:${request.route?.path || request.url}`;
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
            const count = await this.redis.incr(key);
            if (count === 1) {
                await this.redis.expire(key, ttlSeconds);
            }
            return count;
        } catch {
            const now = Date.now();
            const existing = this.memoryFallback.get(key);
            if (!existing || existing.expiresAt <= now) {
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
}
