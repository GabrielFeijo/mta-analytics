import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PlayerEventPayload } from '../../mta/dto/player-event.dto';

function clampUnit(value: number): number {
    return Math.round(Math.max(0, Math.min(1, value)) * 1000) / 1000;
}

/**
 * Pure risk scoring step on a normalized 0.0 - 1.0 scale.
 */
export function computeNextRiskScore(currentScore: number, event: PlayerEventPayload): number {
    const data = event.data || {};
    let delta = 0;

    const txAmount = Math.abs(Number(data.amount ?? data.price ?? 0)) || 0;
    if (txAmount >= 1_000_000) {
        delta += 0.18;
    } else if (txAmount >= 250_000) {
        delta += 0.08;
    }

    const dirtyMoney = Number(data.dirtyMoney ?? 0) || 0;
    if (dirtyMoney >= 500_000) {
        delta += 0.1;
    } else if (dirtyMoney >= 100_000) {
        delta += 0.06;
    }

    if (event.eventType === 'fine_issued') {
        delta += 0.04;
    } else if (event.eventType === 'player_wasted' && data.killerSerial) {
        delta += 0.03;
    }

    const isRoutineActivity =
        event.eventType === 'player_status_sync' ||
        event.eventType === 'initial_player_sync' ||
        (event.eventType === 'player_transaction' && data.type === 'job_payout');

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
    ): Promise<number> {
        const nextScore = computeNextRiskScore(currentScore, event);
        if (nextScore === currentScore) {
            return currentScore;
        }

        await this.prisma.player.update({
            where: { id: playerId },
            data: { riskScore: nextScore },
        });
        return nextScore;
    }
}
