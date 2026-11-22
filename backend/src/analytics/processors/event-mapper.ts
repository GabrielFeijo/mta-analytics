import { TransactionType } from '@prisma/client';
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

export function isSocialEvent(eventType: string): boolean {
    return SOCIAL_EVENTS.has(eventType);
}

export function isEconomicEvent(eventType: string): boolean {
    return ECONOMIC_EVENTS.has(eventType);
}

function finiteOrUndefined(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
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
                amount: Math.abs(rawAmount),
                balance: Number(data.newBalance) || 0,
                source: String(data.source || 'unknown'),
                metadata: data,
            };
        }

        case 'player_transaction': {
            const rawAmount = Math.abs(Number(data.amount) || 0);
            const transType = TRANSACTION_TYPE_MAP[String(data.type || '')] || 'SPEND';
            return {
                playerId,
                type: transType,
                amount: rawAmount,
                balance: Number(data.money) || 0,
                source: String(data.source_resource || 'bank'),
                metadata: data,
            };
        }

        case 'vehicle_purchase':
            return {
                playerId,
                type: 'SPEND',
                amount: Math.abs(Number(data.price) || 0),
                balance: 0,
                source: String(data.source_resource || 'carshop'),
                metadata: data,
            };

        case 'fine_issued':
            return {
                playerId,
                type: 'SPEND',
                amount: Math.abs(Number(data.amount) || 0),
                balance: 0,
                source: 'traffic_fine',
                metadata: data,
            };

        case 'shop_purchase':
            return {
                playerId,
                type: 'SPEND',
                amount: Math.abs(Number(data.amount ?? data.price) || 0),
                balance: Number(data.money) || 0,
                source: String(data.source_resource || 'shop_purchase'),
                metadata: data,
            };

        case 'player_trade': {
            const rawAmount = Number(data.amount);
            if (!Number.isFinite(rawAmount) || rawAmount === 0) {
                return null;
            }
            return {
                playerId,
                type: rawAmount > 0 ? 'TRANSFER_IN' : 'TRANSFER_OUT',
                amount: Math.abs(rawAmount),
                balance: Number(data.money) || 0,
                source: String(data.source_resource || 'player_trade'),
                metadata: data,
            };
        }

        default:
            return null;
    }
}
