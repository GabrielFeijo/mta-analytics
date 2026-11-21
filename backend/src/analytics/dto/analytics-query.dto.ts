import { IsInt, IsISO8601, IsOptional, IsString, Max, Min } from 'class-validator';

export class HeatmapQueryDto {
    @IsString()
    @IsOptional()
    eventType?: string;

    @IsISO8601()
    startDate: string;

    @IsISO8601()
    endDate: string;

    @IsInt()
    @Min(10)
    @Max(500)
    @IsOptional()
    gridSize?: number;
}

export class HoursQueryDto {
    @IsInt()
    @Min(1)
    @Max(720)
    @IsOptional()
    hours?: number;
}

export class LimitQueryDto {
    @IsInt()
    @Min(1)
    @Max(200)
    @IsOptional()
    limit?: number;
}
