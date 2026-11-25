import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import {
    buildTransactionInput,
    extractPlayerMetrics,
    isEconomicEvent,
    isNoisyStreamEvent,
    isSocialEvent,
    resolveSocialRelationType,
    shouldApplyPlayerMetrics,
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

    it('maps player_transaction types accurately and rejects zero/invalid amounts', () => {
        const earnRace = buildTransactionInput(
            {
                eventType: 'player_transaction',
                playerSerial: 'ABC',
                playerName: 'Pilot',
                data: {
                    type: 'race_dirty_earn',
                    amount: 45000,
                    dirtyMoney: 75000,
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
        assert.equal(earnRace.balance, 75000);
        assert.equal(earnRace.source, 'mta_racing');

        const zeroTx = buildTransactionInput(
            {
                eventType: 'vehicle_purchase',
                playerSerial: 'ABC',
                playerName: 'Pilot',
                data: { price: 0 },
            },
            7,
        );
        assert.equal(zeroTx, null);
    });

    it('prevents uninitialized character snapshots from zeroing persisted wealth', () => {
        assert.equal(
            shouldApplyPlayerMetrics('initial_player_sync', { money: 0, bank: 0, level: 1 }),
            false,
        );
        assert.equal(
            shouldApplyPlayerMetrics('initial_player_sync', { id: 12, money: 0, bank: 0, level: 1 }),
            true,
        );
        assert.equal(
            shouldApplyPlayerMetrics('player_status_sync', { money: 0, bank: 0, level: 1 }),
            true,
        );
    });

    it('identifies social, economic, relation types, and noisy stream events', () => {
        assert.equal(isSocialEvent('player_chat'), true);
        assert.equal(isSocialEvent('player_join'), false);
        assert.equal(resolveSocialRelationType('player_trade'), 'TRADE_PARTNER');
        assert.equal(resolveSocialRelationType('faction_action'), 'FACTION_MEMBER');
        assert.equal(isEconomicEvent('vehicle_purchase'), true);
        assert.equal(isEconomicEvent('fine_issued'), true);
        assert.equal(isEconomicEvent('player_position'), false);
        assert.equal(isNoisyStreamEvent('player_position'), true);
        assert.equal(isNoisyStreamEvent('player_status_sync'), true);
        assert.equal(isNoisyStreamEvent('fine_issued'), false);
    });
});
