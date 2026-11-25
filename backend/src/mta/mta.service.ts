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

        await this.eventsQueue.add('process-event', enriched, EVENT_JOB_OPTIONS);
    }

    async processBatchEvents(events: PlayerEventPayload[], serverId?: string): Promise<void> {
        if (events.length === 0) {
            return;
        }

        const jobs = events.map((event) => ({
            name: 'process-event',
            data: {
                ...event,
                serverId: serverId ?? event.serverId,
            },
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
}
