import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class HeartbeatDto {
    @IsInt()
    @Min(0)
    playerCount: number;

    @IsInt()
    @Min(1)
    maxPlayers: number;

    @IsString()
    serverName: string;

    @IsNumber()
    @IsOptional()
    timestamp?: number;

    @IsInt()
    @Min(0)
    @IsOptional()
    queueSize?: number;
}
