import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ResourceFinesAnalyticsService {
    constructor(private readonly prisma: PrismaService) {}

    async getResourceStats(hours: number = 24) {
        const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

        const transactions = await this.prisma.transaction.findMany({
            where: {
                timestamp: { gte: startDate },
                OR: [
                    { source: 'carshop' },
                    { source: 'shop_purchase' },
                    { source: 'mta_racing' },
                    { source: { contains: 'shop' } },
                    { source: { contains: 'vehicle' } },
                    { source: { contains: 'racing' } },
                ],
            },
            include: {
                player: {
                    select: { lastUsername: true },
                },
            },
            orderBy: { timestamp: 'desc' },
        });

        const vehicleSales: Array<{
            id: string;
            player: string;
            amount: number;
            vehicleName: string;
            timestamp: Date;
        }> = [];
        const shopSales: Array<{
            id: string;
            player: string;
            amount: number;
            itemName: string;
            timestamp: Date;
        }> = [];
        const raceActivity: Array<{
            id: string;
            player: string;
            type: string;
            amount: number;
            currency: 'dirty' | 'clean';
            description: string;
            timestamp: Date;
        }> = [];

        let vehicleRevenue = 0;
        let shopRevenue = 0;
        let raceVolume = 0;

        for (const tx of transactions) {
            const meta = (tx.metadata as Record<string, unknown> | null) || {};
            const player = tx.player?.lastUsername || 'Desconhecido';
            const source = tx.source || '';
            const raceType = String(meta.type || '');

            if (source === 'mta_racing' || source.includes('racing') || raceType.startsWith('race_')) {
                raceVolume += tx.amount;
                raceActivity.push({
                    id: tx.id.toString(),
                    player,
                    type: tx.type,
                    amount: tx.amount,
                    currency: raceType.includes('dirty') ? 'dirty' : 'clean',
                    description: String(meta.description || 'Bateria Clandestina (mta_racing)'),
                    timestamp: tx.timestamp,
                });
                continue;
            }

            const isVehicle =
                tx.type === 'SPEND' &&
                (source === 'carshop' || source.includes('vehicle') || Boolean(meta.model));
            if (isVehicle) {
                vehicleRevenue += tx.amount;
                vehicleSales.push({
                    id: tx.id.toString(),
                    player,
                    amount: tx.amount,
                    vehicleName: String(meta.vehicleName || 'Veículo'),
                    timestamp: tx.timestamp,
                });
                continue;
            }

            if (tx.type === 'SPEND' && (source === 'shop_purchase' || source.includes('shop'))) {
                shopRevenue += tx.amount;
                shopSales.push({
                    id: tx.id.toString(),
                    player,
                    amount: tx.amount,
                    itemName: String(meta.description || 'Item de Loja'),
                    timestamp: tx.timestamp,
                });
            }
        }

        return {
            vehicleSales,
            shopSales,
            raceActivity,
            stats: {
                totalRevenue: vehicleRevenue + shopRevenue + raceVolume,
                vehicleRevenue,
                shopRevenue,
                raceVolume,
                totalTransactions: transactions.length,
                vehicleCount: vehicleSales.length,
                shopCount: shopSales.length,
                raceCount: raceActivity.length,
            },
        };
    }

    async getFinesStats(hours: number = 24) {
        const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

        const [fines, topFinedPlayers] = await Promise.all([
            this.prisma.event.findMany({
                where: {
                    eventType: 'fine_issued',
                    timestamp: { gte: startDate },
                },
                include: {
                    player: {
                        select: {
                            lastUsername: true,
                            serial: true,
                        },
                    },
                },
                orderBy: { timestamp: 'desc' },
            }),
            this.prisma.transaction.groupBy({
                by: ['playerId'],
                where: {
                    source: 'traffic_fine',
                    timestamp: { gte: startDate },
                },
                _sum: { amount: true },
                _count: { id: true },
                orderBy: { _sum: { amount: 'desc' } },
                take: 10,
            }),
        ]);

        const playerIds = topFinedPlayers.map((p) => p.playerId);
        const players =
            playerIds.length > 0
                ? await this.prisma.player.findMany({
                      where: { id: { in: playerIds } },
                      select: { id: true, lastUsername: true },
                  })
                : [];
        const playerNameById = new Map(players.map((p) => [p.id, p.lastUsername || 'Unknown']));

        const topPlayers = topFinedPlayers.map((tp) => ({
            username: playerNameById.get(tp.playerId) || 'Unknown',
            totalAmount: tp._sum.amount || 0,
            count: tp._count.id,
        }));

        const totalAmount = fines.reduce((acc, fine) => {
            const data = fine.data as Record<string, unknown> | null;
            return acc + (Number(data?.amount) || 0);
        }, 0);

        return {
            recentFines: fines.map((f) => {
                const data = (f.data as Record<string, unknown> | null) || {};
                return {
                    id: f.id.toString(),
                    player: f.player?.lastUsername || 'Desconhecido',
                    amount: Number(data.amount) || 0,
                    reason: String(data.reason || 'Infração de trânsito'),
                    plate: String(data.plate || 'SEM-PLACA'),
                    timestamp: f.timestamp,
                };
            }),
            topPlayers,
            summary: {
                totalFines: fines.length,
                totalAmount,
            },
        };
    }
}
