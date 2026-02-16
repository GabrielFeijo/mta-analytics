import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PlayersService {
    constructor(private prisma: PrismaService) { }

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
                totalPlaytime: true,
                level: true,
                job: true,
            },
            orderBy: {
                lastSeen: 'desc',
            },
        });
    }

    async getPlayer(id: number) {
        return this.prisma.player.findUnique({
            where: { id },
            include: {
                sessions: {
                    take: 10,
                    orderBy: { loginAt: 'desc' },
                },
                transactions: {
                    take: 20,
                    orderBy: { timestamp: 'desc' },
                },
                relationships: {
                    take: 50,
                    include: {
                        playerB: {
                            select: {
                                id: true,
                                lastUsername: true,
                                serial: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async searchPlayers(query: string) {
        return this.prisma.player.findMany({
            where: {
                OR: [
                    { lastUsername: { contains: query, mode: 'insensitive' } },
                    { serial: { contains: query, mode: 'insensitive' } },
                ],
            },
            take: 20,
            select: {
                id: true,
                serial: true,
                lastUsername: true,
                lastSeen: true,
                riskScore: true,
                level: true,
                job: true,
            },
        });
    }

    async getPlayerStats(id: number) {
        const player = await this.prisma.player.findUnique({
            where: { id },
        });

        if (!player) {
            return null;
        }

        const [eventCount, transactionCount, sessionCount] = await Promise.all([
            this.prisma.event.count({ where: { playerId: id } }),
            this.prisma.transaction.count({ where: { playerId: id } }),
            this.prisma.playerSession.count({ where: { playerId: id } }),
        ]);

        return {
            ...player,
            stats: {
                totalEvents: eventCount,
                totalTransactions: transactionCount,
                totalSessions: sessionCount,
            },
        };
    }
}
