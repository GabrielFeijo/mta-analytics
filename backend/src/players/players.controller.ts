import { Controller, Get, Param, ParseIntPipe, Query, Request, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';
import { RateLimit } from '../common/decorators/rate-limit.decorator';
import { PlayersService } from './players.service';

@Controller('players')
@UseGuards(JwtAuthGuard)
export class PlayersController {
    constructor(private readonly playersService: PlayersService) {}

    @Get('online')
    async getOnlinePlayers() {
        return this.playersService.getOnlinePlayers();
    }

    @Get('search')
    @UseGuards(RateLimitGuard)
    @RateLimit({ limit: 30, ttlSeconds: 60 })
    async searchPlayers(@Query('q') query: string = '') {
        return this.playersService.searchPlayers(query);
    }

    @Get(':id')
    async getPlayer(
        @Param('id', ParseIntPipe) id: number,
        @Request() req: { user?: { role?: Role } },
    ) {
        return this.playersService.getPlayer(id, req.user?.role ?? Role.VIEWER);
    }

    @Get(':id/stats')
    async getPlayerStats(@Param('id', ParseIntPipe) id: number) {
        return this.playersService.getPlayerStats(id);
    }
}
