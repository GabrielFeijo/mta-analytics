import { Transform, Type } from 'class-transformer';
import { IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

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
    eventType: string;

    @IsNumber()
    @IsOptional()
    playerId?: number;

    @IsString()
    playerSerial: string;

    @IsString()
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
    data: Record<string, any>;

    @IsNumber()
    @IsOptional()
    timestamp?: number;
}
