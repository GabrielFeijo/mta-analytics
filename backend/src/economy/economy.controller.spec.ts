import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { ValidationPipe } from '@nestjs/common';
import { EconomyController } from './economy.controller';
import { EconomyService } from './economy.service';
import { TimeSeriesQueryDto, TransactionLimitQueryDto } from './dto/economy-query.dto';

describe('EconomyController & DTO validation', () => {
    it('passes route param playerId (not undefined query) to EconomyService.getPlayerTransactions', async () => {
        let receivedId: number | undefined;
        let receivedLimit: number | undefined;

        const fakeService = {
            getPlayerTransactions: async (playerId: number, limit: number) => {
                receivedId = playerId;
                receivedLimit = limit;
                return [];
            },
        } as unknown as EconomyService;

        const controller = new EconomyController(fakeService);
        await controller.getPlayerTransactions(42, { limit: 25 });

        assert.equal(receivedId, 42);
        assert.equal(receivedLimit, 25);
    });

    it('forwards category filter to EconomyService.getRecentTransactions', async () => {
        let receivedLimit: number | undefined;
        let receivedCategory: string | undefined;

        const fakeService = {
            getRecentTransactions: async (limit: number, category: string) => {
                receivedLimit = limit;
                receivedCategory = category;
                return [];
            },
        } as unknown as EconomyService;

        const controller = new EconomyController(fakeService);
        await controller.getRecentTransactions({ limit: 30, category: 'EARN' });

        assert.equal(receivedLimit, 30);
        assert.equal(receivedCategory, 'EARN');
    });

    it('rejects non-whitelisted timeseries metrics and categories via ValidationPipe', async () => {
        const pipe = new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        });

        const valid = await pipe.transform(
            { metric: 'moneyInCirc', period: '7d' },
            { type: 'query', metatype: TimeSeriesQueryDto },
        );
        assert.equal(valid.metric, 'moneyInCirc');

        await assert.rejects(() =>
            pipe.transform(
                { metric: 'password', period: '7d' },
                { type: 'query', metatype: TimeSeriesQueryDto },
            ),
        );

        await assert.rejects(() =>
            pipe.transform(
                { limit: 20, category: 'INVALID' },
                { type: 'query', metatype: TransactionLimitQueryDto },
            ),
        );
    });
});
