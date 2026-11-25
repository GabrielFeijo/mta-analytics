import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const RECENT_ITEMS_LIMIT = 100;

interface ResourceAggregateRow {
    category: 'race' | 'vehicle' | 'shop';
    type: string;
    total: number;
    count: number;
}

interface ResourceItemRow {
    id: bigint;
    category: 'race' | 'vehicle' | 'shop';
    type: string;
    amount: number;
    source: string;
    metadata: unknown;
    timestamp: Date;
    playerName: string | null;
}

function readFineMetadata(metadata: unknown): { reason: string; plate: string } {
    const record = (metadata && typeof metadata === 'object' ? metadata : {}) as Record<
        string,
        unknown
    >;
    return {
        reason:
            typeof record.reason === 'string' && record.reason.trim()
                ? record.reason
                : 'Infração de trânsito',
        plate:
            typeof record.plate === 'string' && record.plate.trim()
                ? record.plate
                : 'SEM-PLACA',
    };
}

@Injectable()
export class ResourceFinesAnalyticsService {
    constructor(private readonly prisma: PrismaService) {}

    async getResourceStats(hours: number = 24) {
        const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

        const [aggregates, recentRows] = await Promise.all([
            this.prisma.$queryRaw<ResourceAggregateRow[]>`
                WITH categorized AS (
                    SELECT
                        t."type"::text AS "type",
                        t."amount",
                        CASE
                            WHEN t."source" = 'mta_racing'
                              OR t."source" ILIKE '%racing%'
                              OR COALESCE(t."metadata"->>'type', '') LIKE 'race_%' THEN 'race'
                            WHEN t."type" = 'SPEND'
                              AND (
                                t."source" = 'carshop'
                                OR t."source" ILIKE '%vehicle%'
                                OR NULLIF(t."metadata"->>'model', '') IS NOT NULL
                              ) THEN 'vehicle'
                            WHEN t."type" = 'SPEND'
                              AND (
                                t."source" = 'shop_purchase'
                                OR t."source" ILIKE '%shop%'
                                OR t."source" ILIKE '%mechanic%'
                                OR t."source" ILIKE '%fuel%'
                                OR COALESCE(t."metadata"->>'type', '') IN (
                                  'shop_purchase', 'gas_purchase', 'repair_cost',
                                  'ammo_purchase', 'spend_item', 'medical_fee'
                                )
                              ) THEN 'shop'
                            ELSE NULL
                        END AS "category"
                    FROM "transactions" t
                    WHERE t."timestamp" >= ${startDate}
                )
                SELECT
                    "category",
                    "type",
                    COALESCE(SUM("amount"), 0)::double precision AS "total",
                    COUNT(*)::int AS "count"
                FROM categorized
                WHERE "category" IS NOT NULL
                GROUP BY "category", "type"
            `,
            this.prisma.$queryRaw<ResourceItemRow[]>`
                WITH categorized AS (
                    SELECT
                        t."id",
                        t."type"::text AS "type",
                        t."amount",
                        COALESCE(t."source", '') AS "source",
                        t."metadata",
                        t."timestamp",
                        p."lastUsername" AS "playerName",
                        CASE
                            WHEN t."source" = 'mta_racing'
                              OR t."source" ILIKE '%racing%'
                              OR COALESCE(t."metadata"->>'type', '') LIKE 'race_%' THEN 'race'
                            WHEN t."type" = 'SPEND'
                              AND (
                                t."source" = 'carshop'
                                OR t."source" ILIKE '%vehicle%'
                                OR NULLIF(t."metadata"->>'model', '') IS NOT NULL
                              ) THEN 'vehicle'
                            WHEN t."type" = 'SPEND'
                              AND (
                                t."source" = 'shop_purchase'
                                OR t."source" ILIKE '%shop%'
                                OR t."source" ILIKE '%mechanic%'
                                OR t."source" ILIKE '%fuel%'
                                OR COALESCE(t."metadata"->>'type', '') IN (
                                  'shop_purchase', 'gas_purchase', 'repair_cost',
                                  'ammo_purchase', 'spend_item', 'medical_fee'
                                )
                              ) THEN 'shop'
                            ELSE NULL
                        END AS "category"
                    FROM "transactions" t
                    LEFT JOIN "players" p ON p."id" = t."playerId"
                    WHERE t."timestamp" >= ${startDate}
                ),
                ranked AS (
                    SELECT
                        *,
                        ROW_NUMBER() OVER (PARTITION BY "category" ORDER BY "timestamp" DESC) AS "rn"
                    FROM categorized
                    WHERE "category" IS NOT NULL
                )
                SELECT
                    "id",
                    "category",
                    "type",
                    "amount",
                    "source",
                    "metadata",
                    "timestamp",
                    "playerName"
                FROM ranked
                WHERE "rn" <= ${RECENT_ITEMS_LIMIT}
                ORDER BY "timestamp" DESC
            `,
        ]);

        let vehicleRevenue = 0;
        let shopRevenue = 0;
        let raceEarn = 0;
        let raceSpend = 0;
        let vehicleCount = 0;
        let shopCount = 0;
        let raceCount = 0;

        for (const row of aggregates) {
            const total = Number(row.total) || 0;
            const count = Number(row.count) || 0;
            if (row.category === 'vehicle') {
                vehicleRevenue += total;
                vehicleCount += count;
            } else if (row.category === 'shop') {
                shopRevenue += total;
                shopCount += count;
            } else if (row.category === 'race') {
                raceCount += count;
                if (row.type === 'EARN' || row.type === 'TRANSFER_IN') {
                    raceEarn += total;
                } else {
                    raceSpend += total;
                }
            }
        }

        const raceVolume = raceEarn + raceSpend;

        const vehicleSales: Array<{
            id: string;
            player: string;
            amount: number;
            source: string;
            vehicleName: string;
            timestamp: Date;
        }> = [];
        const shopSales: Array<{
            id: string;
            player: string;
            amount: number;
            source: string;
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

        for (const row of recentRows) {
            const meta = (row.metadata && typeof row.metadata === 'object'
                ? row.metadata
                : {}) as Record<string, unknown>;
            const player = row.playerName || 'Desconhecido';
            const id = row.id.toString();

            if (row.category === 'race') {
                const raceType = String(meta.type || '');
                raceActivity.push({
                    id,
                    player,
                    type: row.type,
                    amount: Number(row.amount) || 0,
                    currency: raceType.includes('dirty') ? 'dirty' : 'clean',
                    description: String(meta.description || 'Bateria Clandestina (mta_racing)'),
                    timestamp: row.timestamp,
                });
            } else if (row.category === 'vehicle') {
                vehicleSales.push({
                    id,
                    player,
                    amount: Number(row.amount) || 0,
                    source: row.source || 'carshop',
                    vehicleName: String(meta.vehicleName || 'Veículo'),
                    timestamp: row.timestamp,
                });
            } else if (row.category === 'shop') {
                shopSales.push({
                    id,
                    player,
                    amount: Number(row.amount) || 0,
                    source: row.source || 'shop_purchase',
                    itemName: String(meta.description || 'Item de Loja'),
                    timestamp: row.timestamp,
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
                raceEarn,
                raceSpend,
                totalTransactions: vehicleCount + shopCount + raceCount,
                vehicleCount,
                shopCount,
                raceCount,
            },
        };
    }

    async getFinesStats(hours: number = 24) {
        const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
        const whereClause = {
            source: 'traffic_fine',
            timestamp: { gte: startDate },
        } as const;

        const [recentFineTx, summaryAgg, topFinedPlayers] = await Promise.all([
            this.prisma.transaction.findMany({
                where: whereClause,
                take: RECENT_ITEMS_LIMIT,
                orderBy: { timestamp: 'desc' },
                include: {
                    player: {
                        select: {
                            lastUsername: true,
                            serial: true,
                        },
                    },
                },
            }),
            this.prisma.transaction.aggregate({
                where: whereClause,
                _sum: { amount: true },
                _count: { id: true },
            }),
            this.prisma.transaction.groupBy({
                by: ['playerId'],
                where: whereClause,
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

        return {
            recentFines: recentFineTx.map((tx) => {
                const { reason, plate } = readFineMetadata(tx.metadata);
                return {
                    id: tx.id.toString(),
                    player: tx.player?.lastUsername || 'Desconhecido',
                    amount: tx.amount,
                    reason,
                    plate,
                    timestamp: tx.timestamp,
                };
            }),
            topPlayers: topFinedPlayers.map((tp) => ({
                username: playerNameById.get(tp.playerId) || 'Unknown',
                totalAmount: tp._sum.amount || 0,
                count: tp._count.id,
            })),
            summary: {
                totalFines: summaryAgg._count.id,
                totalAmount: summaryAgg._sum.amount || 0,
            },
        };
    }
}
