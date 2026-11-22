import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
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
    }

    async onModuleInit(): Promise<void> {
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

    async lpush(key: string, value: string): Promise<void> {
        await this.client.lpush(key, value);
    }

    async ltrim(key: string, start: number, stop: number): Promise<void> {
        await this.client.ltrim(key, start, stop);
    }

    async lrange(key: string, start: number, stop: number): Promise<string[]> {
        return this.client.lrange(key, start, stop);
    }

    pipeline() {
        return this.client.pipeline();
    }

    getClient(): Redis {
        return this.client;
    }
}
