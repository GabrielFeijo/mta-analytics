import { Transform, Type } from 'class-transformer';
import {
    IsNotEmpty,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    MaxLength,
    ValidateNested,
} from 'class-validator';

export interface PlayerMetrics {
    money?: number;
    bank?: number;
    dirtyMoney?: number;
    level?: number;
    xp?: number;
    job?: string;
    playedTime?: number;
    id?: number;
    thirst?: number;
    hunger?: number;
    pp?: number;
    faction?: string;
    [key: string]: unknown;
}

export interface PlayerEventPayload {
    eventType: string;
    playerId?: number;
    playerSerial: string;
    playerName: string;
    position?: {
        x: number;
        y: number;
        z: number;
    };
    data: PlayerMetrics;
    timestamp?: number;
    serverId?: string;
}

class PositionDto {
    @IsNumber()
    x: number;

    @IsNumber()
    y: number;

    @IsNumber()
    z: number;
}

export class PlayerEventDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    eventType: string;

    @IsNumber()
    @IsOptional()
    playerId?: number;

    @IsString()
    @IsNotEmpty()
    @MaxLength(64)
    playerSerial: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    playerName: string;

    @ValidateNested()
    @Type(() => PositionDto)
    @IsOptional()
    position?: PositionDto;

    @Transform(({ value }) => {
        if (value === null || value === undefined || Array.isArray(value)) {
            return {};
        }
        return value;
    })
    @IsObject()
    data: Record<string, unknown>;

    @IsNumber()
    @IsOptional()
    timestamp?: number;
}
