import { Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import { PlayerEventPayload } from '../../mta/dto/player-event.dto';
import { AnalyticsGateway } from '../analytics.gateway';
import { RiskScoringService } from '../services/risk-scoring.service';
import {
    buildTransactionInput,
    extractPlayerMetrics,
    isEconomicEvent,
    isSocialEvent,
} from './event-mapper';

@Processor('events')
export class EventProcessor {
    private readonly logger = new Logger(EventProcessor.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
        private readonly gateway: AnalyticsGateway,
        private readonly riskScoring: RiskScoringService,
    ) {}

    @Process('process-event')
    async handleEvent(job: Job<PlayerEventPayload>): Promise<void> {
        const event = job.data;

        try {
            const extractedMetrics = extractPlayerMetrics(event.data || {});
            const eventTime = event.timestamp ? new Date(event.timestamp) : new Date();

            const player = await this.prisma.player.upsert({
                where: { serial: event.playerSerial },
                create: {
                    serial: event.playerSerial,
                    lastUsername: event.playerName,
                    lastSeen: new Date(),
                    ...extractedMetrics,
                },
                update: {
                    lastUsername: event.playerName,
                    lastSeen: new Date(),
                    ...extractedMetrics,
                },
            });

            const createdEvent = await this.prisma.event.create({
                data: {
                    eventType: event.eventType,
                    playerId: player.id,
                    positionX: event.position?.x,
                    positionY: event.position?.y,
                    positionZ: event.position?.z,
                    data: event.data as any,
                    serverId: event.serverId ?? null,
                    timestamp: eventTime,
                },
                include: {
                    player: {
                        select: {
                            lastUsername: true,
                            serial: true,
                        },
                    },
                },
            });

            await this.handleSessionLifecycle(event, player.id, eventTime);

            if (isSocialEvent(event.eventType)) {
                await this.handleSocialEvent(event, player.id);
            }

            if (isEconomicEvent(event.eventType)) {
                await this.handleEconomicEvent(event, player.id);
            }

            await this.safeEvaluateRisk(player.id, player.riskScore, event);

            this.gateway.broadcastEvent('event:new', createdEvent);
        } catch (error) {
            this.logger.error(
                `Error processing event ${event?.eventType}`,
                (error as Error).stack,
            );
            throw error;
        }
    }

    private async handleSessionLifecycle(
        event: PlayerEventPayload,
        playerId: number,
        eventTime: Date,
    ): Promise<void> {
        if (event.eventType === 'player_join') {
            await this.prisma.playerSession.create({
                data: {
                    playerId,
                    loginAt: eventTime,
                    ip: event.data?.ip ? String(event.data.ip) : undefined,
                },
            });
            await this.invalidateOnlineCountCache();
            this.gateway.broadcastEvent('player:online', { playerId });
            return;
        }

        if (event.eventType !== 'player_quit') {
            return;
        }

        const openSession = await this.prisma.playerSession.findFirst({
            where: { playerId, logoutAt: null },
            orderBy: { loginAt: 'desc' },
        });

        if (openSession) {
            const durationMin = Math.max(
                1,
                Math.round((eventTime.getTime() - openSession.loginAt.getTime()) / 60000),
            );
            await Promise.all([
                this.prisma.playerSession.update({
                    where: { id: openSession.id },
                    data: { logoutAt: eventTime, duration: durationMin },
                }),
                this.prisma.player.update({
                    where: { id: playerId },
                    data: { totalPlaytime: { increment: durationMin } },
                }),
            ]);
        }

        await this.invalidateOnlineCountCache();
        this.gateway.broadcastEvent('player:offline', { playerId });
    }

    private async handleSocialEvent(
        event: PlayerEventPayload,
        playerId: number,
    ): Promise<void> {
        const targetPlayerId = Number(event.data?.targetPlayerId);
        if (!Number.isInteger(targetPlayerId) || targetPlayerId <= 0 || targetPlayerId === playerId) {
            return;
        }

        await this.prisma.playerRelationship.upsert({
            where: {
                playerAId_playerBId_type: {
                    playerAId: playerId,
                    playerBId: targetPlayerId,
                    type: 'FRIEND',
                },
            },
            create: {
                playerAId: playerId,
                playerBId: targetPlayerId,
                type: 'FRIEND',
                strength: 1.0,
                interactions: 1,
            },
            update: {
                interactions: { increment: 1 },
                strength: { increment: 0.1 },
                lastSeen: new Date(),
            },
        });
    }

    private async handleEconomicEvent(
        event: PlayerEventPayload,
        playerId: number,
    ): Promise<void> {
        const payload = buildTransactionInput(event, playerId);
        if (!payload) {
            return;
        }

        await this.prisma.transaction.create({
            data: {
                playerId: payload.playerId,
                type: payload.type,
                amount: payload.amount,
                balance: payload.balance,
                source: payload.source,
                metadata: payload.metadata as any,
            },
        });
    }

    private async safeEvaluateRisk(
        playerId: number,
        currentScore: number,
        event: PlayerEventPayload,
    ): Promise<void> {
        try {
            await this.riskScoring.evaluateForEvent(playerId, currentScore, event);
        } catch (err) {
            this.logger.warn(`Risk evaluation skipped for player ${playerId}: ${(err as Error).message}`);
        }
    }

    private async invalidateOnlineCountCache(): Promise<void> {
        try {
            await this.redis.del('metrics:online_players');
        } catch {
            // Non-fatal cache invalidation
        }
    }
}
