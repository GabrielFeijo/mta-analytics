import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
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
    async searchPlayers(@Query('q') query: string = '') {
        return this.playersService.searchPlayers(query);
    }

    @Get(':id')
    async getPlayer(@Param('id', ParseIntPipe) id: number) {
        return this.playersService.getPlayer(id);
    }

    @Get(':id/stats')
    async getPlayerStats(@Param('id', ParseIntPipe) id: number) {
        return this.playersService.getPlayerStats(id);
    }
}
