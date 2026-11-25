import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { computeNextRiskScore } from './risk-scoring.service';

describe('computeNextRiskScore', () => {
    it('increases risk on large transactions and dirtyMoney spikes on a 0.0-1.0 scale', () => {
        const next = computeNextRiskScore(
            0.1,
            {
                eventType: 'player_transaction',
                playerSerial: 'SERIAL1',
                playerName: 'Rafa',
                data: {
                    amount: 1_200_000,
                    dirtyMoney: 600_000,
                },
            },
            { previousDirtyMoney: 0 },
        );

        assert.equal(next, 0.38);
    });

    it('does not inflate risk on routine status sync when dirtyMoney balance stays unchanged', () => {
        const next = computeNextRiskScore(
            0.25,
            {
                eventType: 'player_status_sync',
                playerSerial: 'SERIAL1',
                playerName: 'Rafa',
                data: {
                    money: 5000,
                    dirtyMoney: 600_000,
                },
            },
            { previousDirtyMoney: 600_000 },
        );

        assert.equal(next, 0.24);
    });

    it('penalizes the killer rather than the victim on player_wasted', () => {
        const event = {
            eventType: 'player_wasted',
            playerSerial: 'VICTIM',
            playerName: 'Victim',
            data: { killerSerial: 'KILLER' },
        };

        assert.equal(computeNextRiskScore(0.1, event, { evaluateAsKiller: false }), 0.1);
        assert.equal(computeNextRiskScore(0.1, event, { evaluateAsKiller: true }), 0.13);
    });

    it('clamps values strictly within [0.0, 1.0]', () => {
        const upper = computeNextRiskScore(0.95, {
            eventType: 'player_transaction',
            playerSerial: 'S',
            playerName: 'P',
            data: { amount: 2_000_000, dirtyMoney: 900_000 },
        });
        const lower = computeNextRiskScore(0, {
            eventType: 'player_status_sync',
            playerSerial: 'S',
            playerName: 'P',
            data: {},
        });

        assert.equal(upper, 1);
        assert.equal(lower, 0);
    });
});
