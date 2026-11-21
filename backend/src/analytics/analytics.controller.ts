import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { HeatmapQueryDto, HoursQueryDto, LimitQueryDto } from './dto/analytics-query.dto';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) {}

    @Get('dashboard')
    async getDashboardStats() {
        return this.analyticsService.getInitialDashboardData();
    }

    @Get('server-status')
    async getServerStatus() {
        return this.analyticsService.getServerStatus();
    }

    @Get('overview')
    async getOverviewStats() {
        return this.analyticsService.getOverviewStats();
    }

    @Get('heatmap')
    async getHeatmapData(@Query() query: HeatmapQueryDto) {
        return this.analyticsService.getHeatmapData({
            eventType: query.eventType,
            startDate: new Date(query.startDate),
            endDate: new Date(query.endDate),
            gridSize: query.gridSize,
        });
    }

    @Get('events/recent')
    async getRecentEvents(@Query() query: LimitQueryDto) {
        return this.analyticsService.getRecentEvents(query.limit ?? 50);
    }

    @Get('players/:id/activity')
    async getPlayerActivity(
        @Param('id', ParseIntPipe) id: number,
        @Query() query: HoursQueryDto,
    ) {
        return this.analyticsService.getPlayerActivityTimeline(id, query.hours ?? 24);
    }

    @Get('resources')
    async getResourceStats(@Query() query: HoursQueryDto) {
        return this.analyticsService.getResourceStats(query.hours ?? 24);
    }

    @Get('fines')
    async getFinesStats(@Query() query: HoursQueryDto) {
        return this.analyticsService.getFinesStats(query.hours ?? 24);
    }
}
