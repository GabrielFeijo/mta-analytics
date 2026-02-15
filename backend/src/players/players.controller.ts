import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PlayersService } from './players.service';

@Controller('players')
@UseGuards(JwtAuthGuard)
export class PlayersController {
    constructor(private playersService: PlayersService) { }

    @Get('online')
    async getOnlinePlayers() {
        return this.playersService.getOnlinePlayers();
    }

    @Get('search')
    async searchPlayers(@Query('q') query: string) {
        return this.playersService.searchPlayers(query);
    }

    @Get(':id')
    async getPlayer(@Param('id') id: string) {
        return this.playersService.getPlayer(parseInt(id));
    }

    @Get(':id/stats')
    async getPlayerStats(@Param('id') id: string) {
        return this.playersService.getPlayerStats(parseInt(id));
    }
}
