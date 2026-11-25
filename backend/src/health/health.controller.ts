import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../database/redis.service';

export interface HealthReport {
    status: 'ok' | 'degraded';
    database: 'up' | 'down';
    redis: 'up' | 'down';
    uptimeSeconds: number;
    timestamp: string;
}

@Controller('health')
export class HealthController {
    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
    ) {}

    @Get()
    async check(): Promise<HealthReport> {
        const [dbResult, redisResult] = await Promise.allSettled([
            this.prisma.$queryRaw`SELECT 1`,
            this.redis.ping(),
        ]);

        const database = dbResult.status === 'fulfilled' ? 'up' : 'down';
        const redis =
            redisResult.status === 'fulfilled' && redisResult.value === 'PONG' ? 'up' : 'down';
        const isHealthy = database === 'up' && redis === 'up';

        const report: HealthReport = {
            status: isHealthy ? 'ok' : 'degraded',
            database,
            redis,
            uptimeSeconds: Math.floor(process.uptime()),
            timestamp: new Date().toISOString(),
        };

        if (!isHealthy) {
            throw new ServiceUnavailableException(report);
        }

        return report;
    }
}
