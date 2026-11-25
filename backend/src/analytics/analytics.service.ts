import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { DashboardAnalyticsService } from './services/dashboard-analytics.service';
import { EconomyMetricsService } from './services/economy-metrics.service';
import { HeatmapAnalyticsService } from './services/heatmap-analytics.service';
import { ResourceFinesAnalyticsService } from './services/resource-fines-analytics.service';

@Injectable()
export class AnalyticsService implements OnModuleInit {
    private readonly logger = new Logger(AnalyticsService.name);

    constructor(
        @InjectQueue('metrics') private readonly metricsQueue: Queue,
        private readonly dashboardService: DashboardAnalyticsService,
        private readonly economyMetricsService: EconomyMetricsService,
        private readonly heatmapService: HeatmapAnalyticsService,
        private readonly resourceFinesService: ResourceFinesAnalyticsService,
    ) {}

    async onModuleInit(): Promise<void> {
        try {
            await Promise.all([
                this.metricsQueue.add(
                    'refresh-metrics',
                    {},
                    {
                        repeat: { cron: '0 * * * *' },
                        jobId: 'refresh-metrics-job',
                        removeOnComplete: 50,
                        removeOnFail: 50,
                    },
                ),
                this.metricsQueue.add(
                    'prune-old-data',
                    {},
                    {
                        repeat: { cron: '0 3 * * *' },
                        jobId: 'prune-old-data-job',
                        removeOnComplete: 50,
                        removeOnFail: 50,
                    },
                ),
            ]);
        } catch (error) {
            this.logger.error('Failed to schedule metrics jobs', error as Error);
        }
    }

    getInitialDashboardData() {
        return this.dashboardService.getInitialDashboardData();
    }

    getServerStatus() {
        return this.dashboardService.getServerStatus();
    }

    getOnlinePlayers() {
        return this.dashboardService.getOnlinePlayers();
    }

    getOnlinePlayersCount() {
        return this.dashboardService.getOnlinePlayersCount();
    }

    getRecentEvents(limit: number = 50) {
        return this.dashboardService.getRecentEvents(limit);
    }

    getPlayerActivityTimeline(playerId: number, hours: number = 24) {
        return this.dashboardService.getPlayerActivityTimeline(playerId, hours);
    }

    getOverviewStats() {
        return this.economyMetricsService.getOverviewStats();
    }

    getEconomicSnapshot() {
        return this.economyMetricsService.getEconomicSnapshot();
    }

    generateEconomicMetrics() {
        return this.economyMetricsService.generateEconomicMetrics();
    }

    getHeatmapData(filters: {
        eventType?: string;
        startDate: Date;
        endDate: Date;
        gridSize?: number;
    }) {
        return this.heatmapService.getHeatmapData(filters);
    }

    getResourceStats(hours: number = 24) {
        return this.resourceFinesService.getResourceStats(hours);
    }

    getFinesStats(hours: number = 24) {
        return this.resourceFinesService.getFinesStats(hours);
    }
}
