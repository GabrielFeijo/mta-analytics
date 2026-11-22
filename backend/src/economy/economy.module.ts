import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { EconomyService } from './economy.service';
import { EconomyController } from './economy.controller';

@Module({
    imports: [AnalyticsModule],
    controllers: [EconomyController],
    providers: [EconomyService],
    exports: [EconomyService],
})
export class EconomyModule {}
