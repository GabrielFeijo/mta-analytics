import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private client: Redis;

    constructor(private configService: ConfigService) {
        this.client = new Redis({
            host: this.configService.get('REDIS_HOST') || 'localhost',
            port: parseInt(this.configService.get('REDIS_PORT')) || 6379,
            password: this.configService.get('REDIS_PASSWORD'),
        });
    }

    async onModuleInit() {
        this.client.on('connect', () => {
            console.log('✅ Connected to Redis');
        });

        this.client.on('error', (err) => {
            console.error('❌ Redis error:', err);
        });
    }

    async onModuleDestroy() {
        await this.client.quit();
        console.log('❌ Disconnected from Redis');
    }

    async get(key: string): Promise<string | null> {
        return this.client.get(key);
    }

    async set(key: string, value: string, mode?: string, duration?: number): Promise<void> {
        if (mode === 'EX' && duration) {
            await this.client.setex(key, duration, value);
        } else {
            await this.client.set(key, value);
        }
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

    getClient(): Redis {
        return this.client;
    }
}
