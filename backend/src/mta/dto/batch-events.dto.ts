import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PlayerEventDto } from './player-event.dto';

export class BatchEventsDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PlayerEventDto)
    events: PlayerEventDto[];
}
