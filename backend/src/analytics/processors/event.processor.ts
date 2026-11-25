import { Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import { Prisma } from '@prisma/client';
import { Job } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import { PlayerEventPayload } from '../../mta/dto/player-event.dto';
import { AnalyticsGateway } from '../analytics.gateway';
import { DashboardAnalyticsService } from '../services/dashboard-analytics.service';
import { RiskScoringService } from '../services/risk-scoring.service';
import {
    buildTransactionInput,
    extractPlayerMetrics,
    isEconomicEvent,
    isNoisyStreamEvent,
    isSocialEvent,
    resolveSocialRelationType,
    shouldApplyPlayerMetrics,
} from './event-mapper';

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

@Processor('events')
export class EventProcessor {
    private readonly logger = new Logger(EventProcessor.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
        private readonly gateway: AnalyticsGateway,
        private readonly dashboardAnalytics: DashboardAnalyticsService,
        private readonly riskScoring: RiskScoringService,
    ) {}

    @Process('process-event')
    async handleEvent(job: Job<PlayerEventPayload>): Promise<void> {
        const event = job.data;

        try {
            const parsedEventTime = event.timestamp ? new Date(event.timestamp) : new Date();
            const eventTime = Number.isNaN(parsedEventTime.getTime())
                ? new Date()
                : parsedEventTime;
            const extractedMetrics = shouldApplyPlayerMetrics(event.eventType, event.data || {})
                ? extractPlayerMetrics(event.data || {})
                : {};
            const isRecent = Date.now() - eventTime.getTime() <= ONLINE_WINDOW_MS;
            const isQuit = event.eventType === 'player_quit';

            const outcome = await this.prisma.$transaction(async (tx) => {
                const existing = await tx.player.findUnique({
                    where: { serial: event.playerSerial },
                    select: {
                        id: true,
                        riskScore: true,
                        dirtyMoney: true,
                        lastSeen: true,
                    },
                });

                const isNewerThanLastSeen =
                    !existing || eventTime.getTime() >= existing.lastSeen.getTime();

                const player = await tx.player.upsert({
                    where: { serial: event.playerSerial },
                    create: {
                        serial: event.playerSerial,
                        lastUsername: event.playerName,
                        lastSeen: eventTime,
                        isOnline: isQuit ? false : isRecent,
                        ...extractedMetrics,
                    },
                    update: {
                        lastUsername: event.playerName,
                        ...(isQuit
                            ? { isOnline: false }
                            : isNewerThanLastSeen
                              ? { lastSeen: eventTime, isOnline: isRecent }
                              : {}),
                        ...extractedMetrics,
                    },
                });

                const createdEvent = await tx.event.create({
                    data: {
                        eventType: event.eventType,
                        playerId: player.id,
                        positionX: event.position?.x,
                        positionY: event.position?.y,
                        positionZ: event.position?.z,
                        data: (event.data ?? {}) as Prisma.InputJsonValue,
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

                const sessionTransition = await this.handleSessionLifecycle(
                    tx,
                    event,
                    player.id,
                    eventTime,
                );

                if (isSocialEvent(event.eventType)) {
                    await this.handleSocialEvent(tx, event, player.id, eventTime);
                }

                if (isEconomicEvent(event.eventType)) {
                    await this.handleEconomicEvent(tx, event, player.id, eventTime);
                }

                await this.safeEvaluateRisk(
                    tx,
                    player.id,
                    player.riskScore,
                    existing?.dirtyMoney ?? 0,
                    event,
                );

                return {
                    playerId: player.id,
                    createdEvent,
                    sessionTransition,
                };
            });

            if (outcome.sessionTransition) {
                await this.invalidateOnlineCountCache();
                const onlinePlayers = await this.dashboardAnalytics.getOnlinePlayersCount();
                this.gateway.broadcastEvent(outcome.sessionTransition, {
                    playerId: outcome.playerId,
                    onlinePlayers,
                });
            }

            if (!isNoisyStreamEvent(event.eventType)) {
                this.gateway.broadcastEvent('event:new', outcome.createdEvent);
            }
        } catch (error) {
            this.logger.error(
                `Error processing event ${event?.eventType}`,
                (error as Error).stack,
            );
            throw error;
        }
    }

    private async handleSessionLifecycle(
        tx: Prisma.TransactionClient,
        event: PlayerEventPayload,
        playerId: number,
        eventTime: Date,
    ): Promise<'player:online' | 'player:offline' | null> {
        if (event.eventType === 'player_join') {
            await tx.playerSession.updateMany({
                where: { playerId, logoutAt: null },
                data: { logoutAt: eventTime },
            });
            await tx.playerSession.create({
                data: {
                    playerId,
                    loginAt: eventTime,
                    ip: event.data?.ip ? String(event.data.ip) : undefined,
                },
            });
            return 'player:online';
        }

        if (event.eventType !== 'player_quit') {
            return null;
        }

        const openSession = await tx.playerSession.findFirst({
            where: { playerId, logoutAt: null },
            orderBy: { loginAt: 'desc' },
        });

        if (openSession) {
            const durationMin = Math.max(
                1,
                Math.round((eventTime.getTime() - openSession.loginAt.getTime()) / 60000),
            );
            await tx.playerSession.update({
                where: { id: openSession.id },
                data: { logoutAt: eventTime, duration: durationMin },
            });
            await tx.player.update({
                where: { id: playerId },
                data: { totalPlaytime: { increment: durationMin } },
            });
        }

        return 'player:offline';
    }

    private async handleSocialEvent(
        tx: Prisma.TransactionClient,
        event: PlayerEventPayload,
        playerId: number,
        eventTime: Date,
    ): Promise<void> {
        const targetPlayerId = Number(event.data?.targetPlayerId);
        if (!Number.isInteger(targetPlayerId) || targetPlayerId <= 0 || targetPlayerId === playerId) {
            return;
        }

        const targetExists = await tx.player.findUnique({
            where: { id: targetPlayerId },
            select: { id: true },
        });
        if (!targetExists) {
            return;
        }

        const relationType = resolveSocialRelationType(event.eventType);
        await tx.playerRelationship.upsert({
            where: {
                playerAId_playerBId_type: {
                    playerAId: playerId,
                    playerBId: targetPlayerId,
                    type: relationType,
                },
            },
            create: {
                playerAId: playerId,
                playerBId: targetPlayerId,
                type: relationType,
                strength: 1.0,
                interactions: 1,
                firstSeen: eventTime,
                lastSeen: eventTime,
            },
            update: {
                interactions: { increment: 1 },
                strength: { increment: 0.1 },
                lastSeen: eventTime,
            },
        });
    }

    private async handleEconomicEvent(
        tx: Prisma.TransactionClient,
        event: PlayerEventPayload,
        playerId: number,
        eventTime: Date,
    ): Promise<void> {
        const payload = buildTransactionInput(event, playerId);
        if (!payload) {
            return;
        }

        await tx.transaction.create({
            data: {
                playerId: payload.playerId,
                type: payload.type,
                amount: payload.amount,
                balance: payload.balance,
                source: payload.source,
                metadata: payload.metadata as Prisma.InputJsonValue,
                timestamp: eventTime,
            },
        });
    }

    private async safeEvaluateRisk(
        tx: Prisma.TransactionClient,
        playerId: number,
        currentScore: number,
        previousDirtyMoney: number,
        event: PlayerEventPayload,
    ): Promise<void> {
        try {
            await this.riskScoring.evaluateForEvent(
                playerId,
                currentScore,
                event,
                { previousDirtyMoney, evaluateAsKiller: false },
                tx,
            );

            if (
                event.eventType === 'player_wasted' &&
                typeof event.data?.killerSerial === 'string' &&
                event.data.killerSerial &&
                event.data.killerSerial !== event.playerSerial
            ) {
                const killer = await tx.player.findUnique({
                    where: { serial: event.data.killerSerial },
                    select: { id: true, riskScore: true },
                });
                if (killer) {
                    await this.riskScoring.evaluateForEvent(
                        killer.id,
                        killer.riskScore,
                        event,
                        { evaluateAsKiller: true },
                        tx,
                    );
                }
            }
        } catch (err) {
            this.logger.warn(
                `Risk evaluation skipped for player ${playerId}: ${(err as Error).message}`,
            );
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
