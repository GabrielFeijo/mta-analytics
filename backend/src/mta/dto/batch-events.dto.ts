import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PlayerEventDto } from './player-event.dto';

export class BatchEventsDto {
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(200)
    @ValidateNested({ each: true })
    @Type(() => PlayerEventDto)
    events: PlayerEventDto[];
}
