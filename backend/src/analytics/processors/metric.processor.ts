import { Process, Processor, OnQueueActive } from '@nestjs/bull';
import { Job } from 'bull';
import { AnalyticsService } from '../analytics.service';

@Processor('metrics')
export class MetricProcessor {
    constructor(private analyticsService: AnalyticsService) { }

    @Process('refresh-metrics')
    async handleRefresh(job: Job) {
        console.log('Generating economic metrics snapshot...');
        await this.analyticsService.generateEconomicMetrics();
    }

    @OnQueueActive()
    onActive(job: Job) {
        console.log(
            `Processing job ${job.id} of type ${job.name} with data ${JSON.stringify(
                job.data,
            )}...`,
        );
    }
}
