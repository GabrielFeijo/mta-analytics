import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { JobOptions, Queue } from 'bull';
import { RedisService } from '../database/redis.service';
import { PlayerEventPayload } from './dto/player-event.dto';
import { HeartbeatDto } from './dto/heartbeat.dto';

const EVENT_JOB_OPTIONS: JobOptions = {
    attempts: 3,
    backoff: {
        type: 'exponential',
        delay: 2000,
    },
    removeOnComplete: 500,
    removeOnFail: 200,
};

@Injectable()
export class MtaService {
    constructor(
        private readonly redis: RedisService,
        @InjectQueue('events') private readonly eventsQueue: Queue,
    ) {}

    async processEvent(event: PlayerEventPayload, serverId?: string): Promise<void> {
        const enriched: PlayerEventPayload = {
            ...event,
            serverId: serverId ?? event.serverId,
        };

        await this.recordRecentAndMetrics([enriched]);
        await this.eventsQueue.add('process-event', enriched, EVENT_JOB_OPTIONS);
    }

    async processBatchEvents(events: PlayerEventPayload[], serverId?: string): Promise<void> {
        if (events.length === 0) {
            return;
        }

        const enrichedEvents = events.map((event) => ({
            ...event,
            serverId: serverId ?? event.serverId,
        }));

        await this.recordRecentAndMetrics(enrichedEvents);

        const jobs = enrichedEvents.map((event) => ({
            name: 'process-event',
            data: event,
            opts: EVENT_JOB_OPTIONS,
        }));

        await this.eventsQueue.addBulk(jobs);
    }

    async updateServerStatus(data: HeartbeatDto, serverId?: string): Promise<void> {
        const statusPayload = JSON.stringify({
            ...data,
            serverId: serverId || 'default',
            updatedAt: Date.now(),
        });

        const pipeline = this.redis.pipeline();
        pipeline.setex('server:status', 90, statusPayload);
        if (serverId) {
            pipeline.setex(`server:status:${serverId}`, 90, statusPayload);
        }
        await pipeline.exec();
    }

    private async recordRecentAndMetrics(events: PlayerEventPayload[]): Promise<void> {
        const pipeline = this.redis.pipeline();

        for (const event of events) {
            pipeline.lpush('recent_events', JSON.stringify(event));
            const metricKey = `metrics:${event.eventType}:count`;
            pipeline.incr(metricKey);
            pipeline.expire(metricKey, 3600);
        }

        pipeline.ltrim('recent_events', 0, 999);
        await pipeline.exec();
    }
}
