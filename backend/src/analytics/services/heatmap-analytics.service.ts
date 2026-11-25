import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface HeatmapCell {
    x: number;
    y: number;
    intensity: number;
    count: number;
}

const SPARSE_INTENSITY_FLOOR = 5;
const MAX_HEATMAP_RANGE_MS = 31 * 24 * 60 * 60 * 1000;

/**
 * Normalizes cell intensity in [0, 1] while preventing sparse layers (e.g. 1-2 vehicle sales)
 * from appearing at 100% critical heat.
 */
export function computeCellIntensity(count: number, maxCount: number): number {
    const safeCount = Math.max(0, Number(count) || 0);
    if (safeCount === 0) {
        return 0;
    }
    const baseline = Math.max(SPARSE_INTENSITY_FLOOR, Number(maxCount) || 0);
    return Math.round(Math.min(1, safeCount / baseline) * 1000) / 1000;
}

@Injectable()
export class HeatmapAnalyticsService {
    constructor(private readonly prisma: PrismaService) {}

    async getHeatmapData(filters: {
        eventType?: string;
        startDate: Date;
        endDate: Date;
        gridSize?: number;
    }): Promise<HeatmapCell[]> {
        if (
            Number.isNaN(filters.startDate.getTime()) ||
            Number.isNaN(filters.endDate.getTime())
        ) {
            throw new BadRequestException('Invalid startDate or endDate parameter');
        }
        if (filters.startDate.getTime() > filters.endDate.getTime()) {
            throw new BadRequestException('startDate must be earlier than or equal to endDate');
        }
        if (filters.endDate.getTime() - filters.startDate.getTime() > MAX_HEATMAP_RANGE_MS) {
            throw new BadRequestException('Heatmap query range cannot exceed 31 days');
        }

        const gridSize = Math.min(500, Math.max(10, filters.gridSize || 50));
        const eventFilter =
            filters.eventType && filters.eventType !== 'all'
                ? Prisma.sql`AND "eventType" = ${filters.eventType}`
                : Prisma.empty;

        const rows = await this.prisma.$queryRaw<
            Array<{ x: number; y: number; count: number }>
        >`
            SELECT
                AVG("positionX")::double precision AS x,
                AVG("positionY")::double precision AS y,
                COUNT(*)::int AS count
            FROM "events"
            WHERE "timestamp" BETWEEN ${filters.startDate} AND ${filters.endDate}
              AND "positionX" IS NOT NULL
              AND "positionY" IS NOT NULL
              AND ("data"->>'interior' IS NULL OR "data"->>'interior' = '0')
              AND ("data"->>'dimension' IS NULL OR "data"->>'dimension' = '0')
              ${eventFilter}
            GROUP BY FLOOR("positionX" / ${gridSize}), FLOOR("positionY" / ${gridSize})
            ORDER BY count DESC
            LIMIT 2000
        `;

        if (rows.length === 0) {
            return [];
        }

        const maxCount = Math.max(1, rows[0].count);
        return rows.map((row) => ({
            x: row.x,
            y: row.y,
            count: row.count,
            intensity: computeCellIntensity(row.count, maxCount),
        }));
    }
}
