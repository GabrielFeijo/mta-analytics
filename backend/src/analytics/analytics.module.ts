import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AuthModule } from '../auth/auth.module';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsGateway } from './analytics.gateway';
import { EventProcessor } from './processors/event.processor';
import { MetricProcessor } from './processors/metric.processor';
import { DashboardAnalyticsService } from './services/dashboard-analytics.service';
import { EconomyMetricsService } from './services/economy-metrics.service';
import { HeatmapAnalyticsService } from './services/heatmap-analytics.service';
import { ResourceFinesAnalyticsService } from './services/resource-fines-analytics.service';
import { RiskScoringService } from './services/risk-scoring.service';

@Module({
    imports: [
        AuthModule,
        BullModule.registerQueue(
            { name: 'events' },
            { name: 'metrics' },
        ),
    ],
    controllers: [AnalyticsController],
    providers: [
        AnalyticsService,
        AnalyticsGateway,
        DashboardAnalyticsService,
        EconomyMetricsService,
        HeatmapAnalyticsService,
        ResourceFinesAnalyticsService,
        RiskScoringService,
        EventProcessor,
        MetricProcessor,
    ],
    exports: [AnalyticsService, AnalyticsGateway, EconomyMetricsService],
})
export class AnalyticsModule {}
