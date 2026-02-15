import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsGateway } from './analytics.gateway';
import { EventProcessor } from './processors/event.processor';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'events',
        }),
    ],
    controllers: [AnalyticsController],
    providers: [AnalyticsService, AnalyticsGateway, EventProcessor],
    exports: [AnalyticsService, AnalyticsGateway],
})
export class AnalyticsModule { }
