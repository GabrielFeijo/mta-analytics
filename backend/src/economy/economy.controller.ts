import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { EconomyService } from './economy.service';
import { TimeSeriesQueryDto, TransactionLimitQueryDto } from './dto/economy-query.dto';

@Controller('economy')
@UseGuards(JwtAuthGuard)
export class EconomyController {
    constructor(private readonly economyService: EconomyService) {}

    @Get('snapshot')
    async getSnapshot() {
        return this.economyService.getSnapshot();
    }

    @Get('timeseries')
    async getTimeSeries(@Query() query: TimeSeriesQueryDto) {
        return this.economyService.getTimeSeries(query.metric, query.period ?? '24h');
    }

    @Get('transactions/recent')
    async getRecentTransactions(@Query() query: TransactionLimitQueryDto) {
        return this.economyService.getRecentTransactions(query.limit ?? 50);
    }

    @Get('transactions/player/:id')
    async getPlayerTransactions(
        @Param('id', ParseIntPipe) id: number,
        @Query() query: TransactionLimitQueryDto,
    ) {
        return this.economyService.getPlayerTransactions(id, query.limit ?? 50);
    }
}
