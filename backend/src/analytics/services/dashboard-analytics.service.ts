import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import { EconomyMetricsService } from './economy-metrics.service';

export interface ServerHeartbeatStatus {
    online: boolean;
    playerCount: number;
    maxPlayers: number;
    serverName: string | null;
    queueSize: number;
    serverId?: string;
    updatedAt: number | null;
}

@Injectable()
export class DashboardAnalyticsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
        private readonly economyMetrics: EconomyMetricsService,
    ) {}

    async getInitialDashboardData() {
        const now = Date.now();
        const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);
        const oneHourAgo = new Date(now - 60 * 60 * 1000);

        const [
            totalPlayers,
            onlinePlayers,
            recentEvents,
            economicSnapshot,
            riskAlerts,
            players24hAgo,
            prevHourMetric,
            serverStatus,
        ] = await Promise.all([
            this.prisma.player.count(),
            this.getOnlinePlayersCount(),
            this.getRecentEvents(10),
            this.economyMetrics.getEconomicSnapshot(),
            this.prisma.player.count({ where: { riskScore: { gte: 0.5 } } }),
            this.prisma.player.count({
                where: { firstSeen: { lte: twentyFourHoursAgo } },
            }),
            this.prisma.hourlyMetric.findFirst({
                where: {
                    metricName: 'online_players',
                    timestamp: { lte: oneHourAgo },
                },
                orderBy: { timestamp: 'desc' },
            }),
            this.getServerStatus(),
        ]);

        const playerGrowthPct =
            players24hAgo > 0
                ? ((totalPlayers - players24hAgo) / players24hAgo) * 100
                : 0;

        const onlineTrend = this.formatPercentTrend(
            onlinePlayers,
            prevHourMetric?.value ?? null,
        );

        return {
            totalPlayers,
            onlinePlayers,
            recentEvents,
            economicSnapshot,
            riskAlerts,
            serverStatus,
            trends: {
                playerGrowth: `${playerGrowthPct >= 0 ? '+' : ''}${playerGrowthPct.toFixed(1)}`,
                onlineTrend,
            },
            timestamp: now,
        };
    }

    async getServerStatus(): Promise<ServerHeartbeatStatus> {
        try {
            const raw = await this.redis.get('server:status');
            if (!raw) {
                return {
                    online: false,
                    playerCount: 0,
                    maxPlayers: 0,
                    serverName: null,
                    queueSize: 0,
                    updatedAt: null,
                };
            }
            const parsed = JSON.parse(raw) as Partial<ServerHeartbeatStatus>;
            return {
                online: true,
                playerCount: Number(parsed.playerCount) || 0,
                maxPlayers: Number(parsed.maxPlayers) || 0,
                serverName: parsed.serverName ? String(parsed.serverName) : null,
                queueSize: Number(parsed.queueSize) || 0,
                serverId: parsed.serverId ? String(parsed.serverId) : undefined,
                updatedAt: parsed.updatedAt ? Number(parsed.updatedAt) : null,
            };
        } catch {
            return {
                online: false,
                playerCount: 0,
                maxPlayers: 0,
                serverName: null,
                queueSize: 0,
                updatedAt: null,
            };
        }
    }

    async getOnlinePlayersCount(): Promise<number> {
        const cached = await this.redis.get('metrics:online_players');
        if (cached !== null) {
            return parseInt(cached, 10) || 0;
        }

        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const count = await this.prisma.player.count({
            where: {
                lastSeen: { gte: fiveMinutesAgo },
            },
        });

        await this.redis.set('metrics:online_players', count.toString(), 'EX', 30);
        return count;
    }

    async getOnlinePlayers() {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return this.prisma.player.findMany({
            where: {
                lastSeen: { gte: fiveMinutesAgo },
            },
            select: {
                id: true,
                serial: true,
                lastUsername: true,
                lastSeen: true,
                riskScore: true,
            },
            orderBy: { lastSeen: 'desc' },
        });
    }

    async getRecentEvents(limit: number = 50) {
        return this.prisma.event.findMany({
            take: Math.min(200, Math.max(1, limit)),
            orderBy: { timestamp: 'desc' },
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

    async getPlayerActivityTimeline(playerId: number, hours: number = 24) {
        const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
        return this.prisma.event.findMany({
            where: {
                playerId,
                timestamp: { gte: startDate },
            },
            orderBy: { timestamp: 'asc' },
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
    }

    private formatPercentTrend(current: number, baseline: number | null): string {
        if (baseline === null || baseline <= 0) {
            return '0%';
        }
        const pct = Math.round(((current - baseline) / baseline) * 100);
        return `${pct >= 0 ? '+' : ''}${pct}%`;
    }
}
