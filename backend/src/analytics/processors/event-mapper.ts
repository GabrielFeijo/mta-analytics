import { RelationType, TransactionType } from '@prisma/client';
import { PlayerEventPayload, PlayerMetrics } from '../../mta/dto/player-event.dto';

export const TRANSACTION_TYPE_MAP: Record<string, TransactionType> = {
    deposit: 'TRANSFER_OUT',
    withdraw: 'TRANSFER_IN',
    business_deposit: 'TRANSFER_OUT',
    business_withdraw: 'TRANSFER_IN',
    transfer_sent: 'TRANSFER_OUT',
    transfer_received: 'TRANSFER_IN',
    shop_purchase: 'SPEND',
    gas_purchase: 'SPEND',
    repair_cost: 'SPEND',
    traffic_fine: 'SPEND',
    ammo_purchase: 'SPEND',
    job_payout: 'EARN',
    illegal_income: 'EARN',
    spend_item: 'SPEND',
    robbery_reward: 'EARN',
    money_laundering: 'EARN',
    medical_fee: 'SPEND',
    government_fee: 'SPEND',
    item_sale: 'EARN',
    chat_fee: 'SPEND',
    toll_fee: 'SPEND',
    race_clean_spend: 'SPEND',
    race_dirty_spend: 'SPEND',
    race_clean_earn: 'EARN',
    race_dirty_earn: 'EARN',
};

const SOCIAL_EVENTS = new Set(['player_chat', 'player_trade', 'faction_action']);

const ECONOMIC_EVENTS = new Set([
    'player_money_change',
    'player_trade',
    'shop_purchase',
    'player_transaction',
    'vehicle_purchase',
    'fine_issued',
]);

const NOISY_STREAM_EVENTS = new Set(['player_position', 'player_status_sync']);

export function isSocialEvent(eventType: string): boolean {
    return SOCIAL_EVENTS.has(eventType);
}

export function isEconomicEvent(eventType: string): boolean {
    return ECONOMIC_EVENTS.has(eventType);
}

export function isNoisyStreamEvent(eventType: string): boolean {
    return NOISY_STREAM_EVENTS.has(eventType);
}

export function resolveSocialRelationType(eventType: string): RelationType {
    switch (eventType) {
        case 'player_trade':
            return 'TRADE_PARTNER';
        case 'faction_action':
            return 'FACTION_MEMBER';
        default:
            return 'FRIEND';
    }
}

/**
 * Prevents uninitialized character snapshots on login/quit (no charId and all-zero balances)
 * from overwriting persisted player wealth in PostgreSQL.
 */
export function shouldApplyPlayerMetrics(eventType: string, data: PlayerMetrics): boolean {
    if (eventType !== 'initial_player_sync' && eventType !== 'player_quit') {
        return true;
    }
    const hasCharId = finiteOrUndefined(data.id) !== undefined;
    if (hasCharId) {
        return true;
    }
    const money = finiteOrUndefined(data.money) ?? 0;
    const bank = finiteOrUndefined(data.bank) ?? 0;
    const dirtyMoney = finiteOrUndefined(data.dirtyMoney) ?? 0;
    const level = finiteOrUndefined(data.level) ?? 1;
    return !(money === 0 && bank === 0 && dirtyMoney === 0 && level <= 1);
}

function finiteOrUndefined(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function roundCurrency(value: number): number {
    return Math.round(value * 100) / 100;
}

function parsePositiveAmount(value: unknown): number | null {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return null;
    }
    return roundCurrency(parsed);
}

export function extractPlayerMetrics(data: PlayerMetrics): Record<string, number | string> {
    const metrics: Record<string, number | string> = {};

    const numericMappings: Array<[keyof PlayerMetrics, string]> = [
        ['money', 'money'],
        ['bank', 'bank'],
        ['dirtyMoney', 'dirtyMoney'],
        ['level', 'level'],
        ['xp', 'experience'],
        ['playedTime', 'playedTime'],
        ['id', 'characterId'],
        ['thirst', 'thirst'],
        ['hunger', 'hunger'],
        ['pp', 'premiumPoints'],
    ];

    for (const [sourceKey, targetKey] of numericMappings) {
        const value = finiteOrUndefined(data[sourceKey]);
        if (value !== undefined) {
            metrics[targetKey] = value;
        }
    }

    if (typeof data.job === 'string' && data.job.trim() !== '') {
        metrics.job = data.job;
    }
    if (data.faction !== undefined && data.faction !== null) {
        metrics.faction = String(data.faction);
    }

    return metrics;
}

export interface TransactionCreatePayload {
    playerId: number;
    type: TransactionType;
    amount: number;
    balance: number;
    source: string;
    metadata: Record<string, unknown>;
}

export function buildTransactionInput(
    event: PlayerEventPayload,
    playerId: number,
): TransactionCreatePayload | null {
    const data = event.data || {};

    switch (event.eventType) {
        case 'player_money_change': {
            const rawAmount = Number(data.amount);
            if (!Number.isFinite(rawAmount) || rawAmount === 0) {
                return null;
            }
            return {
                playerId,
                type: rawAmount > 0 ? 'EARN' : 'SPEND',
                amount: roundCurrency(Math.abs(rawAmount)),
                balance: roundCurrency(Number(data.newBalance) || 0),
                source: String(data.source || 'unknown'),
                metadata: data,
            };
        }

        case 'player_transaction': {
            const rawType = String(data.type || '');
            const rawAmount = Number(data.amount);
            if (!Number.isFinite(rawAmount) || rawAmount === 0) {
                return null;
            }
            const amount = roundCurrency(Math.abs(rawAmount));
            const transType = TRANSACTION_TYPE_MAP[rawType] || 'SPEND';
            let balance = Number(data.money) || 0;
            if (rawType.includes('dirty')) {
                balance = Number(data.dirtyMoney ?? data.money) || 0;
            } else if (
                rawType === 'deposit' ||
                rawType === 'withdraw' ||
                rawType.includes('business_')
            ) {
                balance = Number(data.bank ?? data.money) || 0;
            }

            return {
                playerId,
                type: transType,
                amount,
                balance: roundCurrency(balance),
                source: String(data.source_resource || 'bank'),
                metadata: data,
            };
        }

        case 'vehicle_purchase': {
            const amount = parsePositiveAmount(data.price);
            if (amount === null) {
                return null;
            }
            const rawBalance =
                data.paymentMethod === 'bank'
                    ? (data.bank ?? data.money)
                    : (data.money ?? data.bank);
            return {
                playerId,
                type: 'SPEND',
                amount,
                balance: roundCurrency(Number(rawBalance) || 0),
                source: String(data.source_resource || 'carshop'),
                metadata: data,
            };
        }

        case 'fine_issued': {
            const amount = parsePositiveAmount(data.amount);
            if (amount === null) {
                return null;
            }
            return {
                playerId,
                type: 'SPEND',
                amount,
                balance: roundCurrency(Number(data.bank ?? data.money) || 0),
                source: 'traffic_fine',
                metadata: data,
            };
        }

        case 'shop_purchase': {
            const amount = parsePositiveAmount(data.amount ?? data.price);
            if (amount === null) {
                return null;
            }
            return {
                playerId,
                type: 'SPEND',
                amount,
                balance: roundCurrency(Number(data.money) || 0),
                source: String(data.source_resource || 'shop_purchase'),
                metadata: data,
            };
        }

        case 'player_trade': {
            const rawAmount = Number(data.amount);
            if (!Number.isFinite(rawAmount) || rawAmount === 0) {
                return null;
            }
            return {
                playerId,
                type: rawAmount > 0 ? 'TRANSFER_IN' : 'TRANSFER_OUT',
                amount: roundCurrency(Math.abs(rawAmount)),
                balance: roundCurrency(Number(data.money) || 0),
                source: String(data.source_resource || 'player_trade'),
                metadata: data,
            };
        }

        default:
            return null;
    }
}
