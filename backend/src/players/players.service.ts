import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

const PLAYER_SUMMARY_SELECT = {
    id: true,
    serial: true,
    lastUsername: true,
    lastSeen: true,
    riskScore: true,
    totalPlaytime: true,
    playedTime: true,
    money: true,
    bank: true,
    dirtyMoney: true,
    level: true,
    job: true,
    faction: true,
    characterId: true,
} as const;

@Injectable()
export class PlayersService {
    constructor(private readonly prisma: PrismaService) {}

    async getOnlinePlayers() {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        return this.prisma.player.findMany({
            where: {
                lastSeen: { gte: fiveMinutesAgo },
            },
            select: PLAYER_SUMMARY_SELECT,
            orderBy: { lastSeen: 'desc' },
        });
    }

    async getPlayer(id: number) {
        const player = await this.prisma.player.findUnique({
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

        if (!player) {
            throw new NotFoundException(`Jogador #${id} não encontrado.`);
        }
        return player;
    }

    async searchPlayers(query: string) {
        const trimmed = (query || '').trim();
        if (!trimmed) {
            return [];
        }

        return this.prisma.player.findMany({
            where: {
                OR: [
                    { lastUsername: { contains: trimmed, mode: 'insensitive' } },
                    { serial: { contains: trimmed, mode: 'insensitive' } },
                    { job: { contains: trimmed, mode: 'insensitive' } },
                    { faction: { contains: trimmed, mode: 'insensitive' } },
                ],
            },
            take: 25,
            select: PLAYER_SUMMARY_SELECT,
            orderBy: { lastSeen: 'desc' },
        });
    }

    async getPlayerStats(id: number) {
        const player = await this.prisma.player.findUnique({
            where: { id },
        });

        if (!player) {
            throw new NotFoundException(`Jogador #${id} não encontrado.`);
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
