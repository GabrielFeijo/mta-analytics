import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const ATOMIC_INCR_WITH_TTL_LUA = `
local current = redis.call('INCR', KEYS[1])
if current == 1 or redis.call('TTL', KEYS[1]) == -1 then
    redis.call('EXPIRE', KEYS[1], tonumber(ARGV[1]))
end
return current
`;

@Injectable()
export class RedisService implements OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);
    private readonly client: Redis;

    constructor(private readonly configService: ConfigService) {
        const port = parseInt(this.configService.get<string>('REDIS_PORT') || '6379', 10) || 6379;
        const password = this.configService.get<string>('REDIS_PASSWORD');

        this.client = new Redis({
            host: this.configService.get<string>('REDIS_HOST') || 'localhost',
            port,
            password: password || undefined,
        });

        this.client.on('connect', () => {
            this.logger.log('Connected to Redis');
        });

        this.client.on('error', (err) => {
            this.logger.error(`Redis error: ${err.message}`);
        });
    }

    async onModuleDestroy(): Promise<void> {
        await this.client.quit();
        this.logger.log('Disconnected from Redis');
    }

    async ping(): Promise<string> {
        return this.client.ping();
    }

    async get(key: string): Promise<string | null> {
        return this.client.get(key);
    }

    async set(key: string, value: string, mode?: string, duration?: number): Promise<void> {
        if (mode === 'EX' && duration) {
            await this.client.setex(key, duration, value);
            return;
        }
        await this.client.set(key, value);
    }

    async setNxEx(key: string, value: string, ttlSeconds: number): Promise<boolean> {
        const result = await this.client.set(key, value, 'EX', ttlSeconds, 'NX');
        return result === 'OK';
    }

    async exists(key: string): Promise<boolean> {
        const count = await this.client.exists(key);
        return count > 0;
    }

    async del(key: string): Promise<void> {
        await this.client.del(key);
    }

    async incr(key: string): Promise<number> {
        return this.client.incr(key);
    }

    async expire(key: string, seconds: number): Promise<void> {
        await this.client.expire(key, seconds);
    }

    async incrementWithTtl(key: string, ttlSeconds: number): Promise<number> {
        const result = await this.client.eval(ATOMIC_INCR_WITH_TTL_LUA, 1, key, ttlSeconds);
        return Number(result);
    }

    pipeline() {
        return this.client.pipeline();
    }

    getClient(): Redis {
        return this.client;
    }
}
