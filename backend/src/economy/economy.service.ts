import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class EconomyService {
    constructor(private prisma: PrismaService) { }

    async getSnapshot() {
        const latest = await this.prisma.economicMetric.findFirst({
            orderBy: {
                timestamp: 'desc',
            },
        });

        if (!latest) {
            const [totalPlayers, totalTransactions] = await Promise.all([
                this.prisma.player.count(),
                this.prisma.transaction.aggregate({
                    _sum: { amount: true },
                }),
            ]);

            return {
                totalMoney: totalTransactions._sum.amount || 0,
                moneyInCirc: totalTransactions._sum.amount || 0,
                avgPlayerWealth: totalPlayers > 0 ? (totalTransactions._sum.amount || 0) / totalPlayers : 0,
                inflationRate: 0,
                timestamp: new Date(),
            };
        }

        return latest;
    }

    async getTimeSeries(metric: string, period: string) {
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case '24h':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }

        const metrics = await this.prisma.economicMetric.findMany({
            where: {
                timestamp: {
                    gte: startDate,
                },
            },
            orderBy: {
                timestamp: 'asc',
            },
        });

        return metrics.map(m => ({
            timestamp: m.timestamp,
            value: m[metric] || 0,
        }));
    }

    async getRecentTransactions(limit: number = 50) {
        return this.prisma.transaction.findMany({
            take: limit,
            orderBy: {
                timestamp: 'desc',
            },
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
    }

    async getPlayerTransactions(playerId: number, limit: number = 50) {
        return this.prisma.transaction.findMany({
            where: { playerId },
            take: limit,
            orderBy: {
                timestamp: 'desc',
            },
        });
    }
}
