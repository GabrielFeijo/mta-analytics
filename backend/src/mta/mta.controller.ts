import { Controller, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { MtaService } from './mta.service';
import { PlayerEventDto } from './dto/player-event.dto';
import { BatchEventsDto } from './dto/batch-events.dto';
import { PlayerEventSchema } from './dto/player-event.dto';

@Controller('mta')
@UseGuards(ApiKeyGuard)
export class MtaController {
    constructor(private readonly mtaService: MtaService) { }

    @Post('event')
    @HttpCode(200)
    async handleEvent(@Body() event: PlayerEventDto) {
        const validated = PlayerEventSchema.parse(event);

        await this.mtaService.processEvent(validated);

        return { success: true, timestamp: Date.now() };
    }

    @Post('events/batch')
    @HttpCode(200)
    async handleBatchEvents(@Body() dto: BatchEventsDto) {
        await this.mtaService.processBatchEvents(dto.events);

        return {
            success: true,
            processed: dto.events.length,
            timestamp: Date.now()
        };
    }

    @Post('heartbeat')
    @HttpCode(200)
    async handleHeartbeat(@Body() data: any) {
        await this.mtaService.updateServerStatus(data);

        return { success: true };
    }
}
