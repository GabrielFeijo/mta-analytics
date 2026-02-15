import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../database/redis.service';

@Injectable()
export class AnalyticsService {
    constructor(
        private prisma: PrismaService,
        private redis: RedisService,
    ) { }

    async getInitialDashboardData() {
        const [
            totalPlayers,
            onlinePlayers,
            recentEvents,
            economicSnapshot,
        ] = await Promise.all([
            this.prisma.player.count(),
            this.getOnlinePlayersCount(),
            this.getRecentEvents(10),
            this.getEconomicSnapshot(),
        ]);

        return {
            totalPlayers,
            onlinePlayers,
            recentEvents,
            economicSnapshot,
            timestamp: Date.now(),
        };
    }

    async getOnlinePlayersCount(): Promise<number> {
        const cached = await this.redis.get('metrics:online_players');
        if (cached) return parseInt(cached);

        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const count = await this.prisma.player.count({
            where: {
                lastSeen: {
                    gte: fiveMinutesAgo,
                },
            },
        });

        await this.redis.set('metrics:online_players', count.toString(), 'EX', 30);
        return count;
    }

    async getOnlinePlayers() {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        return this.prisma.player.findMany({
            where: {
                lastSeen: {
                    gte: fiveMinutesAgo,
                },
            },
            select: {
                id: true,
                serial: true,
                lastUsername: true,
                lastSeen: true,
                riskScore: true,
            },
            orderBy: {
                lastSeen: 'desc',
            },
        });
    }

    async getRecentEvents(limit: number = 50) {
        return this.prisma.event.findMany({
            take: limit,
            orderBy: {
                timestamp: 'desc',
            },
            include: {
                player: {
                    select: {
                        lastUsername: true,
                        serial: true,
                    },
                },
            },
        });
    }

    async getEconomicSnapshot() {
        const latest = await this.prisma.economicMetric.findFirst({
            orderBy: {
                timestamp: 'desc',
            },
        });

        if (!latest) {
            return {
                totalMoney: 0,
                moneyInCirc: 0,
                avgPlayerWealth: 0,
                inflationRate: 0,
            };
        }

        return {
            totalMoney: latest.totalMoney,
            moneyInCirc: latest.moneyInCirc,
            avgPlayerWealth: latest.avgPlayerWealth,
            inflationRate: latest.inflationRate || 0,
        };
    }

    async getHeatmapData(filters: {
        eventType: string;
        startDate: Date;
        endDate: Date;
    }) {
        const events = await this.prisma.event.findMany({
            where: {
                eventType: filters.eventType,
                timestamp: {
                    gte: filters.startDate,
                    lte: filters.endDate,
                },
                positionX: { not: null },
                positionY: { not: null },
            },
            select: {
                positionX: true,
                positionY: true,
                positionZ: true,
            },
        });

        const gridSize = 50;
        const heatmap = new Map<string, number>();

        events.forEach(event => {
            const gridX = Math.floor(event.positionX / gridSize);
            const gridY = Math.floor(event.positionY / gridSize);
            const key = `${gridX},${gridY}`;

            heatmap.set(key, (heatmap.get(key) || 0) + 1);
        });

        const maxIntensity = Math.max(...heatmap.values());

        return Array.from(heatmap.entries()).map(([key, count]) => {
            const [x, y] = key.split(',').map(Number);
            return {
                x: x * gridSize,
                y: y * gridSize,
                intensity: count / maxIntensity,
                count,
            };
        });
    }

    async getPlayerActivityTimeline(playerId: number, hours: number = 24) {
        const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

        const events = await this.prisma.event.findMany({
            where: {
                playerId,
                timestamp: {
                    gte: startDate,
                },
            },
            orderBy: {
                timestamp: 'asc',
            },
            select: {
                id: true,
                timestamp: true,
                eventType: true,
                positionX: true,
                positionY: true,
                positionZ: true,
                data: true,
            },
        });

        return events;
    }
}
