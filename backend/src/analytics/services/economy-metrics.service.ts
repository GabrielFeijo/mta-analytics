import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface EconomicSnapshotDto {
    totalMoney: number;
    moneyInCirc: number;
    dirtyMoney: number;
    avgPlayerWealth: number;
    inflationRate: number;
    timestamp: Date;
}

export interface OverviewDayPointDto {
    name: string;
    earn: number;
    spend: number;
    total: number;
}

@Injectable()
export class EconomyMetricsService {
    constructor(private readonly prisma: PrismaService) {}

    async getEconomicSnapshot(): Promise<EconomicSnapshotDto> {
        const latest = await this.prisma.economicMetric.findFirst({
            orderBy: { timestamp: 'desc' },
        });

        if (!latest) {
            return this.generateEconomicMetrics();
        }

        const meta = latest.metadata as Record<string, unknown> | null;
        return {
            totalMoney: latest.totalMoney,
            moneyInCirc: latest.moneyInCirc,
            dirtyMoney: Number(meta?.dirtyMoney) || 0,
            avgPlayerWealth: latest.avgPlayerWealth,
            inflationRate: latest.inflationRate || 0,
            timestamp: latest.timestamp,
        };
    }

    async generateEconomicMetrics(): Promise<EconomicSnapshotDto> {
        const [aggregate, lastMetric] = await Promise.all([
            this.prisma.player.aggregate({
                _sum: {
                    money: true,
                    bank: true,
                    dirtyMoney: true,
                },
                _count: { _all: true },
            }),
            this.prisma.economicMetric.findFirst({
                orderBy: { timestamp: 'desc' },
            }),
        ]);

        const moneyInCirc = Math.max(0, aggregate._sum.money ?? 0);
        const bankTotal = Math.max(0, aggregate._sum.bank ?? 0);
        const dirtyMoney = Math.max(0, aggregate._sum.dirtyMoney ?? 0);
        const totalMoney = moneyInCirc + bankTotal;
        const totalPlayers = aggregate._count._all;
        const avgPlayerWealth = totalPlayers > 0 ? totalMoney / totalPlayers : 0;

        let inflationRate = 0;
        if (lastMetric && lastMetric.totalMoney > 0) {
            inflationRate = Number(
                (((totalMoney - lastMetric.totalMoney) / lastMetric.totalMoney) * 100).toFixed(2),
            );
        }

        const created = await this.prisma.economicMetric.create({
            data: {
                totalMoney,
                moneyInCirc,
                avgPlayerWealth,
                inflationRate,
                metadata: { dirtyMoney, bankTotal },
                timestamp: new Date(),
            },
        });

        return {
            totalMoney: created.totalMoney,
            moneyInCirc: created.moneyInCirc,
            dirtyMoney,
            avgPlayerWealth: created.avgPlayerWealth,
            inflationRate: created.inflationRate || 0,
            timestamp: created.timestamp,
        };
    }

    async getOverviewStats(): Promise<OverviewDayPointDto[]> {
        const startDate = new Date();
        startDate.setUTCHours(0, 0, 0, 0);
        startDate.setUTCDate(startDate.getUTCDate() - 6);

        const rows = await this.prisma.$queryRaw<
            Array<{ day: Date; type: string; total: number }>
        >`
            SELECT
                DATE_TRUNC('day', "timestamp") AS day,
                "type"::text AS type,
                COALESCE(SUM("amount"), 0)::double precision AS total
            FROM "transactions"
            WHERE "timestamp" >= ${startDate}
              AND "type" IN ('EARN', 'SPEND')
            GROUP BY 1, 2
            ORDER BY 1 ASC
        `;

        const buckets = new Map<string, { label: string; earn: number; spend: number }>();
        for (let offset = 0; offset < 7; offset += 1) {
            const d = new Date(startDate);
            d.setUTCDate(startDate.getUTCDate() + offset);
            const isoDay = d.toISOString().slice(0, 10);
            const label = `${String(d.getUTCDate()).padStart(2, '0')}/${String(
                d.getUTCMonth() + 1,
            ).padStart(2, '0')}`;
            buckets.set(isoDay, { label, earn: 0, spend: 0 });
        }

        for (const row of rows) {
            const isoDay = new Date(row.day).toISOString().slice(0, 10);
            const bucket = buckets.get(isoDay);
            if (!bucket) {
                continue;
            }
            if (row.type === 'EARN') {
                bucket.earn += Number(row.total) || 0;
            } else {
                bucket.spend += Number(row.total) || 0;
            }
        }

        return Array.from(buckets.values()).map((bucket) => ({
            name: bucket.label,
            earn: bucket.earn,
            spend: bucket.spend,
            total: bucket.earn - bucket.spend,
        }));
    }
}
