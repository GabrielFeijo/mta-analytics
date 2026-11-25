import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
    computeCellIntensity,
    HeatmapAnalyticsService,
} from './heatmap-analytics.service';

describe('HeatmapAnalyticsService', () => {
    it('prevents sparse layers from saturating at 1.0 intensity', () => {
        assert.equal(computeCellIntensity(2, 2), 0.4);
        assert.equal(computeCellIntensity(1, 2), 0.2);
        assert.equal(computeCellIntensity(48, 48), 1);
        assert.equal(computeCellIntensity(24, 48), 0.5);
        assert.equal(computeCellIntensity(0, 10), 0);
        assert.equal(computeCellIntensity(-3, 10), 0);
    });

    it('rejects invalid date filters with BadRequestException', async () => {
        const fakePrisma = {} as PrismaService;
        const service = new HeatmapAnalyticsService(fakePrisma);

        await assert.rejects(
            () =>
                service.getHeatmapData({
                    eventType: 'vehicle_purchase',
                    startDate: new Date('invalid-date'),
                    endDate: new Date(),
                }),
            BadRequestException,
        );
    });

    it('rejects reversed or oversized date ranges with BadRequestException', async () => {
        const fakePrisma = {} as PrismaService;
        const service = new HeatmapAnalyticsService(fakePrisma);
        const now = Date.now();

        await assert.rejects(
            () =>
                service.getHeatmapData({
                    eventType: 'player_position',
                    startDate: new Date(now),
                    endDate: new Date(now - 60_000),
                }),
            BadRequestException,
        );

        await assert.rejects(
            () =>
                service.getHeatmapData({
                    eventType: 'player_position',
                    startDate: new Date(now - 35 * 86_400_000),
                    endDate: new Date(now),
                }),
            BadRequestException,
        );
    });

    it('returns empty array when no events match the layer', async () => {
        const fakePrisma = {
            $queryRaw: async () => [],
        } as unknown as PrismaService;
        const service = new HeatmapAnalyticsService(fakePrisma);

        const cells = await service.getHeatmapData({
            eventType: 'vehicle_purchase',
            startDate: new Date(Date.now() - 86_400_000),
            endDate: new Date(),
        });

        assert.deepEqual(cells, []);
    });

    it('maps aggregated vehicle_purchase cells with averaged coordinates and dampened intensity', async () => {
        const fakePrisma = {
            $queryRaw: async () => [
                { x: 965.4, y: -1572.1, count: 2 },
                { x: -1956.2, y: 294.8, count: 1 },
            ],
        } as unknown as PrismaService;
        const service = new HeatmapAnalyticsService(fakePrisma);

        const cells = await service.getHeatmapData({
            eventType: 'vehicle_purchase',
            startDate: new Date(Date.now() - 86_400_000),
            endDate: new Date(),
        });

        assert.deepEqual(cells, [
            { x: 965.4, y: -1572.1, count: 2, intensity: 0.4 },
            { x: -1956.2, y: 294.8, count: 1, intensity: 0.2 },
        ]);
    });
});
