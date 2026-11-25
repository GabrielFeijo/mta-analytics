import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
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

const MAX_SEARCH_QUERY_LENGTH = 100;

@Injectable()
export class PlayersService {
    constructor(private readonly prisma: PrismaService) {}

    async getOnlinePlayers() {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        return this.prisma.player.findMany({
            where: {
                isOnline: true,
                lastSeen: { gte: fiveMinutesAgo },
            },
            select: PLAYER_SUMMARY_SELECT,
            orderBy: { lastSeen: 'desc' },
        });
    }

    async getPlayer(id: number, requesterRole: Role = Role.VIEWER) {
        const includeIp = requesterRole === Role.ADMIN || requesterRole === Role.MODERATOR;

        const player = await this.prisma.player.findUnique({
            where: { id },
            include: {
                sessions: {
                    take: 10,
                    orderBy: { loginAt: 'desc' },
                    select: {
                        id: true,
                        playerId: true,
                        loginAt: true,
                        logoutAt: true,
                        duration: true,
                        ip: includeIp,
                    },
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
        const trimmed = (query || '').trim().slice(0, MAX_SEARCH_QUERY_LENGTH);
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
            include: {
                _count: {
                    select: {
                        events: true,
                        transactions: true,
                        sessions: true,
                    },
                },
            },
        });

        if (!player) {
            throw new NotFoundException(`Jogador #${id} não encontrado.`);
        }

        const { _count, ...playerFields } = player;
        return {
            ...playerFields,
            stats: {
                totalEvents: _count.events,
                totalTransactions: _count.transactions,
                totalSessions: _count.sessions,
            },
        };
    }
}
