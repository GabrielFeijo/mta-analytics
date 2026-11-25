import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnQueueActive, Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { AnalyticsGateway } from '../analytics.gateway';
import { DashboardAnalyticsService } from '../services/dashboard-analytics.service';
import { EconomyMetricsService } from '../services/economy-metrics.service';

const PRUNE_BATCH_SIZE = 5000;
const PRUNE_MAX_BATCHES = 20;

@Processor('metrics')
export class MetricProcessor {
    private readonly logger = new Logger(MetricProcessor.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
        private readonly economyMetrics: EconomyMetricsService,
        private readonly dashboardAnalytics: DashboardAnalyticsService,
        private readonly gateway: AnalyticsGateway,
    ) {}

    @Process('refresh-metrics')
    async handleRefresh(): Promise<void> {
        const [snapshot, onlineCount] = await Promise.all([
            this.economyMetrics.generateEconomicMetrics(),
            this.dashboardAnalytics.getOnlinePlayersCount(),
        ]);

        const hourBucket = new Date();
        hourBucket.setMinutes(0, 0, 0);

        await this.prisma.hourlyMetric.upsert({
            where: {
                timestamp_metricName: {
                    timestamp: hourBucket,
                    metricName: 'online_players',
                },
            },
            create: {
                timestamp: hourBucket,
                metricName: 'online_players',
                value: onlineCount,
            },
            update: {
                value: onlineCount,
            },
        });

        this.gateway.broadcastEvent('economy:update', snapshot);
    }

    @Process('prune-old-data')
    async handlePruneOldData(): Promise<void> {
        const retentionDays = Math.max(
            1,
            parseInt(this.configService.get<string>('EVENT_RETENTION_DAYS') || '14', 10) || 14,
        );
        const now = new Date();
        const cutoffDate = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const staleSessionCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const deletedEvents = await this.pruneNoisyEventsInBatches(cutoffDate);

        const [deletedSessions, markedOffline, closedOrphanSessions] = await Promise.all([
            this.prisma.session.deleteMany({
                where: { expiresAt: { lt: now } },
            }),
            this.prisma.player.updateMany({
                where: {
                    isOnline: true,
                    lastSeen: { lt: fiveMinutesAgo },
                },
                data: { isOnline: false },
            }),
            this.prisma.playerSession.updateMany({
                where: {
                    logoutAt: null,
                    loginAt: { lt: staleSessionCutoff },
                    player: { isOnline: false },
                },
                data: { logoutAt: now },
            }),
        ]);

        this.logger.log(
            `Pruned ${deletedEvents} old telemetry events (>${retentionDays}d), ${deletedSessions.count} expired admin sessions, marked ${markedOffline.count} stale players offline, and closed ${closedOrphanSessions.count} orphan sessions.`,
        );
    }

    private async pruneNoisyEventsInBatches(cutoffDate: Date): Promise<number> {
        let totalDeleted = 0;

        for (let i = 0; i < PRUNE_MAX_BATCHES; i += 1) {
            const deletedCount = await this.prisma.$executeRaw`
                DELETE FROM "events"
                WHERE "id" IN (
                    SELECT "id"
                    FROM "events"
                    WHERE "eventType" IN ('player_position', 'player_status_sync')
                      AND "timestamp" < ${cutoffDate}
                    ORDER BY "timestamp" ASC
                    LIMIT ${PRUNE_BATCH_SIZE}
                )
            `;
            totalDeleted += deletedCount;
            if (deletedCount < PRUNE_BATCH_SIZE) {
                break;
            }
        }

        return totalDeleted;
    }

    @OnQueueActive()
    onActive(job: Job): void {
        this.logger.debug(`Processing metrics job ${job.id} (${job.name})`);
    }
}
