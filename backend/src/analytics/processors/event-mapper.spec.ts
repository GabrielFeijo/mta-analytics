import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import {
    buildTransactionInput,
    extractPlayerMetrics,
    isEconomicEvent,
    isSocialEvent,
} from './event-mapper';

describe('event-mapper', () => {
    it('extracts player metrics including dirtyMoney while ignoring empty values', () => {
        const metrics = extractPlayerMetrics({
            money: 15000,
            bank: 250000,
            dirtyMoney: 45000,
            level: 12,
            xp: 8900,
            job: 'Mecânico',
            faction: 'Garage Night',
            playedTime: 320,
            id: 42,
            thirst: 80,
            hunger: 90,
            pp: 500,
        });

        assert.deepEqual(metrics, {
            money: 15000,
            bank: 250000,
            dirtyMoney: 45000,
            level: 12,
            experience: 8900,
            job: 'Mecânico',
            faction: 'Garage Night',
            playedTime: 320,
            characterId: 42,
            thirst: 80,
            hunger: 90,
            premiumPoints: 500,
        });
    });

    it('maps player_transaction types accurately', () => {
        const earnRace = buildTransactionInput(
            {
                eventType: 'player_transaction',
                playerSerial: 'ABC',
                playerName: 'Pilot',
                data: {
                    type: 'race_dirty_earn',
                    amount: 45000,
                    money: 120000,
                    source_resource: 'mta_racing',
                },
            },
            7,
        );

        assert.ok(earnRace);
        assert.equal(earnRace.playerId, 7);
        assert.equal(earnRace.type, 'EARN');
        assert.equal(earnRace.amount, 45000);
        assert.equal(earnRace.source, 'mta_racing');

        const deposit = buildTransactionInput(
            {
                eventType: 'player_transaction',
                playerSerial: 'ABC',
                playerName: 'Pilot',
                data: {
                    type: 'deposit',
                    amount: 10000,
                    money: 5000,
                },
            },
            7,
        );

        assert.ok(deposit);
        assert.equal(deposit.type, 'TRANSFER_OUT');
        assert.equal(deposit.source, 'bank');
    });

    it('identifies social and economic event classes', () => {
        assert.equal(isSocialEvent('player_chat'), true);
        assert.equal(isSocialEvent('player_join'), false);
        assert.equal(isEconomicEvent('vehicle_purchase'), true);
        assert.equal(isEconomicEvent('fine_issued'), true);
        assert.equal(isEconomicEvent('player_position'), false);
    });
});
