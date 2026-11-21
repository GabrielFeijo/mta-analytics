import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export const ALLOWED_ECONOMY_METRICS = [
    'totalMoney',
    'moneyInCirc',
    'avgPlayerWealth',
    'inflationRate',
] as const;

export type EconomyTimeSeriesMetric = (typeof ALLOWED_ECONOMY_METRICS)[number];

export const ALLOWED_ECONOMY_PERIODS = ['24h', '7d', '30d'] as const;
export type EconomyPeriod = (typeof ALLOWED_ECONOMY_PERIODS)[number];

export class TimeSeriesQueryDto {
    @IsIn(ALLOWED_ECONOMY_METRICS)
    metric: EconomyTimeSeriesMetric;

    @IsOptional()
    @IsIn(ALLOWED_ECONOMY_PERIODS)
    period?: EconomyPeriod;
}

export class TransactionLimitQueryDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(200)
    limit?: number;
}
