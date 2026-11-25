import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { PlayerEventPayload } from '../../mta/dto/player-event.dto';
import { isEconomicEvent } from '../processors/event-mapper';

export interface RiskEvaluationContext {
    previousDirtyMoney?: number;
    evaluateAsKiller?: boolean;
}

function clampUnit(value: number): number {
    return Math.round(Math.max(0, Math.min(1, value)) * 1000) / 1000;
}

/**
 * Pure risk scoring step on a normalized 0.0 - 1.0 scale.
 * Evaluates dirtyMoney increases (delta) rather than static balances, and penalizes
 * killers rather than victims on `player_wasted`.
 */
export function computeNextRiskScore(
    currentScore: number,
    event: PlayerEventPayload,
    context: RiskEvaluationContext = {},
): number {
    const data = event.data || {};
    let delta = 0;

    if (!context.evaluateAsKiller && isEconomicEvent(event.eventType)) {
        const txAmount = Math.abs(Number(data.amount ?? data.price ?? 0)) || 0;
        if (txAmount >= 1_000_000) {
            delta += 0.18;
        } else if (txAmount >= 250_000) {
            delta += 0.08;
        }
    }

    if (!context.evaluateAsKiller) {
        const rawDirty = Number(data.dirtyMoney);
        const dirtyMoney = Number.isFinite(rawDirty) ? Math.max(0, rawDirty) : 0;
        const isSyncEvent =
            event.eventType === 'player_status_sync' || event.eventType === 'initial_player_sync';
        const dirtyDelta =
            context.previousDirtyMoney !== undefined
                ? Math.max(0, dirtyMoney - context.previousDirtyMoney)
                : isSyncEvent
                  ? 0
                  : dirtyMoney;

        if (dirtyDelta >= 500_000) {
            delta += 0.1;
        } else if (dirtyDelta >= 100_000) {
            delta += 0.06;
        }
    }

    if (event.eventType === 'fine_issued' && !context.evaluateAsKiller) {
        delta += 0.04;
    } else if (
        event.eventType === 'player_wasted' &&
        context.evaluateAsKiller &&
        Boolean(data.killerSerial)
    ) {
        delta += 0.03;
    }

    const isRoutineActivity =
        !context.evaluateAsKiller &&
        (event.eventType === 'player_status_sync' ||
            event.eventType === 'initial_player_sync' ||
            (event.eventType === 'player_transaction' && data.type === 'job_payout'));

    if (delta === 0 && isRoutineActivity) {
        delta = -0.01;
    }

    return clampUnit((Number(currentScore) || 0) + delta);
}

@Injectable()
export class RiskScoringService {
    constructor(private readonly prisma: PrismaService) {}

    async evaluateForEvent(
        playerId: number,
        currentScore: number,
        event: PlayerEventPayload,
        context: RiskEvaluationContext = {},
        db: Prisma.TransactionClient | PrismaService = this.prisma,
    ): Promise<number> {
        const nextScore = computeNextRiskScore(currentScore, event, context);
        if (nextScore === currentScore) {
            return currentScore;
        }

        await db.player.update({
            where: { id: playerId },
            data: { riskScore: nextScore },
        });
        return nextScore;
    }
}
