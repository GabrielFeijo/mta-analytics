import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface HeatmapCell {
    x: number;
    y: number;
    intensity: number;
    count: number;
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

        const gridSize = Math.min(500, Math.max(10, filters.gridSize || 50));
        const eventFilter =
            filters.eventType && filters.eventType !== 'all'
                ? Prisma.sql`AND "eventType" = ${filters.eventType}`
                : Prisma.empty;

        const rows = await this.prisma.$queryRaw<
            Array<{ x: number; y: number; count: number }>
        >`
            SELECT
                (FLOOR("positionX" / ${gridSize}) * ${gridSize})::double precision AS x,
                (FLOOR("positionY" / ${gridSize}) * ${gridSize})::double precision AS y,
                COUNT(*)::int AS count
            FROM "events"
            WHERE "timestamp" BETWEEN ${filters.startDate} AND ${filters.endDate}
              AND "positionX" IS NOT NULL
              AND "positionY" IS NOT NULL
              ${eventFilter}
            GROUP BY 1, 2
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
            intensity: row.count / maxCount,
        }));
    }
}
