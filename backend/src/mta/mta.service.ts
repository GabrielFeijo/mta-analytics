import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../database/redis.service';
import { PlayerEventZod } from './dto/player-event.dto';

@Injectable()
export class MtaService {
    constructor(
        private prisma: PrismaService,
        private redis: RedisService,
        @InjectQueue('events') private eventsQueue: Queue,
    ) { }

    async processEvent(event: PlayerEventZod) {
        await this.redis.lpush(
            'recent_events',
            JSON.stringify(event),
        );
        await this.redis.ltrim('recent_events', 0, 999);

        await this.eventsQueue.add('process-event', event, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
        });

        await this.updateRealTimeMetrics(event);
    }

    async processBatchEvents(events: PlayerEventZod[]) {
        const jobs = events.map(event => ({
            name: 'process-event',
            data: event,
        }));

        await this.eventsQueue.addBulk(jobs);
    }

    async updateServerStatus(data: any) {
        await this.redis.set('server:status', JSON.stringify(data), 'EX', 60);
    }

    private async updateRealTimeMetrics(event: PlayerEventZod) {
        const key = `metrics:${event.eventType}:count`;
        await this.redis.incr(key);
        await this.redis.expire(key, 3600);
    }
}
