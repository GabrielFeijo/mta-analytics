import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { MtaService } from './mta.service';
import { PlayerEventDto } from './dto/player-event.dto';
import { BatchEventsDto } from './dto/batch-events.dto';
import { HeartbeatDto } from './dto/heartbeat.dto';

type AuthenticatedMtaRequest = Request & { serverId?: string };

@Controller('mta')
@UseGuards(ApiKeyGuard)
export class MtaController {
    constructor(private readonly mtaService: MtaService) {}

    @Post('event')
    @HttpCode(200)
    async handleEvent(
        @Body() event: PlayerEventDto,
        @Req() req: AuthenticatedMtaRequest,
    ) {
        await this.mtaService.processEvent(event, req.serverId);
        return { success: true, timestamp: Date.now() };
    }

    @Post('events/batch')
    @HttpCode(200)
    async handleBatchEvents(
        @Body() dto: BatchEventsDto,
        @Req() req: AuthenticatedMtaRequest,
    ) {
        await this.mtaService.processBatchEvents(dto.events, req.serverId);
        return {
            success: true,
            processed: dto.events.length,
            timestamp: Date.now(),
        };
    }

    @Post('heartbeat')
    @HttpCode(200)
    async handleHeartbeat(
        @Body() data: HeartbeatDto,
        @Req() req: AuthenticatedMtaRequest,
    ) {
        await this.mtaService.updateServerStatus(data, req.serverId);
        return { success: true, timestamp: Date.now() };
    }
}
