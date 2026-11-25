import { Injectable } from '@nestjs/common';
import { EconomicMetric, TransactionType } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { EconomyMetricsService } from '../analytics/services/economy-metrics.service';
import {
    EconomyPeriod,
    EconomyTimeSeriesMetric,
    TransactionCategoryFilter,
} from './dto/economy-query.dto';

const PERIOD_HOURS: Record<EconomyPeriod, number> = {
    '24h': 24,
    '7d': 7 * 24,
    '30d': 30 * 24,
};

const INFLOW_TYPES: TransactionType[] = ['EARN', 'TRANSFER_IN', 'ADMIN_ADD'];
const OUTFLOW_TYPES: TransactionType[] = ['SPEND', 'TRANSFER_OUT', 'ADMIN_REMOVE'];

function readMetricField(row: EconomicMetric, metric: EconomyTimeSeriesMetric): number {
    switch (metric) {
        case 'totalMoney':
            return row.totalMoney;
        case 'moneyInCirc':
            return row.moneyInCirc;
        case 'avgPlayerWealth':
            return row.avgPlayerWealth;
        case 'inflationRate':
            return row.inflationRate ?? 0;
    }
}

function extractDescription(metadata: unknown): string | null {
    if (!metadata || typeof metadata !== 'object') {
        return null;
    }
    const record = metadata as Record<string, unknown>;
    if (typeof record.description === 'string' && record.description.trim()) {
        return record.description;
    }
    if (typeof record.vehicleName === 'string' && record.vehicleName.trim()) {
        return record.vehicleName;
    }
    if (typeof record.reason === 'string' && record.reason.trim()) {
        return record.reason;
    }
    return null;
}

@Injectable()
export class EconomyService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly economyMetrics: EconomyMetricsService,
    ) {}

    async getSnapshot() {
        return this.economyMetrics.getEconomicSnapshot();
    }

    async getTimeSeries(metric: EconomyTimeSeriesMetric, period: EconomyPeriod = '24h') {
        const hours = PERIOD_HOURS[period] ?? 24;
        const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

        const metrics = await this.prisma.economicMetric.findMany({
            where: {
                timestamp: { gte: startDate },
            },
            orderBy: { timestamp: 'asc' },
        });

        return metrics.map((row) => ({
            timestamp: row.timestamp,
            value: readMetricField(row, metric),
        }));
    }

    async getRecentTransactions(
        limit: number = 50,
        category: TransactionCategoryFilter = 'ALL',
    ) {
        const typeFilter =
            category === 'EARN'
                ? { in: INFLOW_TYPES }
                : category === 'SPEND'
                  ? { in: OUTFLOW_TYPES }
                  : undefined;

        const transactions = await this.prisma.transaction.findMany({
            where: typeFilter ? { type: typeFilter } : undefined,
            take: Math.min(200, Math.max(1, limit)),
            orderBy: { timestamp: 'desc' },
            include: {
                player: {
                    select: {
                        id: true,
                        lastUsername: true,
                        serial: true,
                    },
                },
            },
        });

        return transactions.map((tx) => ({
            ...tx,
            description: extractDescription(tx.metadata),
        }));
    }

    async getPlayerTransactions(playerId: number, limit: number = 50) {
        const transactions = await this.prisma.transaction.findMany({
            where: { playerId },
            take: Math.min(200, Math.max(1, limit)),
            orderBy: { timestamp: 'desc' },
        });

        return transactions.map((tx) => ({
            ...tx,
            description: extractDescription(tx.metadata),
        }));
    }
}
