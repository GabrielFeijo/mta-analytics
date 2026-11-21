import { Logger } from '@nestjs/common';
import { OnQueueActive, Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { AnalyticsGateway } from '../analytics.gateway';
import { DashboardAnalyticsService } from '../services/dashboard-analytics.service';
import { EconomyMetricsService } from '../services/economy-metrics.service';

@Processor('metrics')
export class MetricProcessor {
    private readonly logger = new Logger(MetricProcessor.name);

    constructor(
        private readonly prisma: PrismaService,
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
        const retentionDays = Math.max(1, parseInt(process.env.EVENT_RETENTION_DAYS || '14', 10) || 14);
        const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
        const now = new Date();

        const [deletedPositions, deletedSessions] = await Promise.all([
            this.prisma.event.deleteMany({
                where: {
                    eventType: 'player_position',
                    timestamp: { lt: cutoffDate },
                },
            }),
            this.prisma.session.deleteMany({
                where: {
                    expiresAt: { lt: now },
                },
            }),
        ]);

        this.logger.log(
            `Pruned ${deletedPositions.count} old position events (>${retentionDays}d) and ${deletedSessions.count} expired admin sessions.`,
        );
    }

    @OnQueueActive()
    onActive(job: Job): void {
        this.logger.debug(`Processing metrics job ${job.id} (${job.name})`);
    }
}
