import { IsString, IsNumber, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { z } from 'zod';

export interface PlayerMetrics {
    money?: number;
    bank?: number;
    level?: number;
    experience?: number;
    job?: string;
    playedTime?: number;
    characterId?: number;
    thirst?: number;
    hunger?: number;
    premiumPoints?: number;
    faction?: string;
    // Add other possible fields that might come in 'data'
    [key: string]: any;
}

export const PlayerEventSchema = z.object({
    eventType: z.string(),
    playerId: z.number().optional(),
    playerSerial: z.string(),
    playerName: z.string(),
    position: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
    }).optional(),
    data: z.record(z.any()),
    timestamp: z.number().optional(),
});

export type PlayerEventZod = z.infer<typeof PlayerEventSchema>;

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

    @IsObject()
    data: Record<string, any>;

    @IsNumber()
    @IsOptional()
    timestamp?: number;
}
