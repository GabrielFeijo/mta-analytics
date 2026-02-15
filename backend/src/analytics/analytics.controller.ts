import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
    constructor(private analyticsService: AnalyticsService) { }

    @Get('dashboard')
    async getDashboardStats() {
        return this.analyticsService.getInitialDashboardData();

    }

    @Get('heatmap')
    async getHeatmapData(
        @Query('eventType') eventType: string,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        return this.analyticsService.getHeatmapData({
            eventType,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
        });
    }

    @Get('events/recent')
    async getRecentEvents(@Query('limit') limit?: string) {
        const limitNum = limit ? parseInt(limit) : 50;
        return this.analyticsService.getRecentEvents(limitNum);
    }

    @Get('players/:id/activity')
    async getPlayerActivity(
        @Query('id') id: string,
        @Query('hours') hours?: string,
    ) {
        const hoursNum = hours ? parseInt(hours) : 24;
        return this.analyticsService.getPlayerActivityTimeline(parseInt(id), hoursNum);
    }
}
