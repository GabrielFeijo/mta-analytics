import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsGateway } from './analytics.gateway';
import { EventProcessor } from './processors/event.processor';
import { MetricProcessor } from './processors/metric.processor';

@Module({
    imports: [
        BullModule.registerQueue(
            {
                name: 'events',
            },
            {
                name: 'metrics',
            },
        ),
    ],
    controllers: [AnalyticsController],
    providers: [
        AnalyticsService,
        AnalyticsGateway,
        EventProcessor,
        MetricProcessor,
    ],
    exports: [AnalyticsService, AnalyticsGateway],
})
export class AnalyticsModule { }
