import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { EconomyService } from './economy.service';

@Controller('economy')
@UseGuards(JwtAuthGuard)
export class EconomyController {
    constructor(private economyService: EconomyService) { }

    @Get('snapshot')
    async getSnapshot() {
        return this.economyService.getSnapshot();
    }

    @Get('timeseries')
    async getTimeSeries(
        @Query('metric') metric: string,
        @Query('period') period: string,
    ) {
        return this.economyService.getTimeSeries(metric, period);
    }

    @Get('transactions/recent')
    async getRecentTransactions(@Query('limit') limit?: string) {
        const limitNum = limit ? parseInt(limit) : 50;
        return this.economyService.getRecentTransactions(limitNum);
    }

    @Get('transactions/player/:id')
    async getPlayerTransactions(
        @Query('id') id: string,
        @Query('limit') limit?: string,
    ) {
        const limitNum = limit ? parseInt(limit) : 50;
        return this.economyService.getPlayerTransactions(parseInt(id), limitNum);
    }
}
