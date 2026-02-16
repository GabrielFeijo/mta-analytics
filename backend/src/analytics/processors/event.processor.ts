import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { PlayerEventZod, PlayerMetrics } from '../../mta/dto/player-event.dto';
import { Prisma } from '@prisma/client';

@Processor('events')
export class EventProcessor {
	constructor(private prisma: PrismaService) { }

	@Process('process-event')
	async handleEvent(job: Job<PlayerEventZod>) {
		const event = job.data;

		try {
			const player = await this.prisma.player.upsert({
				where: { serial: event.playerSerial },
				create: {
					serial: event.playerSerial,
					lastUsername: event.playerName,
					lastSeen: new Date(),
				},
				update: {
					lastUsername: event.playerName,
					lastSeen: new Date(),
					...this.extractPlayerMetrics(event.data),
				},
			});

			await this.prisma.event.create({
				data: {
					eventType: event.eventType,
					playerId: player.id,
					positionX: event.position?.x,
					positionY: event.position?.y,
					positionZ: event.position?.z,
					data: event.data as Prisma.InputJsonValue,
					timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
				},
			});

			if (this.isSocialEvent(event)) {
				await this.updatePlayerRelationships(event, player.id);
			}

			if (this.isEconomicEvent(event)) {
				await this.updateEconomicMetrics(event, player.id);
			}
		} catch (error) {
			console.error('Error processing event:', error);
			throw error;
		}
	}

	private isSocialEvent(event: PlayerEventZod): boolean {
		const socialEvents = ['player_chat', 'player_trade', 'faction_action'];
		return socialEvents.includes(event.eventType);
	}

	private isEconomicEvent(event: PlayerEventZod): boolean {
		const economicEvents = [
			'player_money_change',
			'player_trade',
			'shop_purchase',
			'player_transaction',
			'vehicle_purchase',
			'fine_issued',
		];
		return economicEvents.includes(event.eventType);
	}

	private async updatePlayerRelationships(
		event: PlayerEventZod,
		playerId: number,
	) {
		if (event.data.targetPlayerId) {
			await this.prisma.playerRelationship.upsert({
				where: {
					playerAId_playerBId_type: {
						playerAId: playerId,
						playerBId: event.data.targetPlayerId,
						type: 'FRIEND',
					},
				},
				create: {
					playerAId: playerId,
					playerBId: event.data.targetPlayerId,
					type: 'FRIEND',
					strength: 1.0,
					interactions: 1,
				},
				update: {
					interactions: { increment: 1 },
					strength: { increment: 0.1 },
					lastSeen: new Date(),
				},
			});
		}
	}

	private async updateEconomicMetrics(event: PlayerEventZod, playerId: number) {
		switch (event.eventType) {
			case 'player_money_change':
				if (event.data.amount) {
					await this.prisma.transaction.create({
						data: {
							playerId,
							type: event.data.amount > 0 ? 'EARN' : 'SPEND',
							amount: Math.abs(event.data.amount),
							balance: event.data.newBalance || 0,
							source: event.data.source || 'unknown',
							metadata: event.data,
						},
					});
				}
				break;

			case 'player_transaction':
				const transTypeMap: Record<
					string,
					'EARN' | 'SPEND' | 'TRANSFER_IN' | 'TRANSFER_OUT'
				> = {
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
				};

				const type = transTypeMap[event.data.type] || 'SPEND';

				await this.prisma.transaction.create({
					data: {
						playerId,
						type,
						amount: Math.abs(event.data.amount),
						balance: 0,
						source: event.data.source_resource || 'bank',
						metadata: event.data,
					},
				});
				break;

			case 'vehicle_purchase':
				await this.prisma.transaction.create({
					data: {
						playerId,
						type: 'SPEND',
						amount: Math.abs(event.data.price),
						balance: 0,
						source: event.data.source_resource || 'carshop',
						metadata: event.data,
					},
				});
				break;

			case 'fine_issued':
				await this.prisma.transaction.create({
					data: {
						playerId,
						type: 'SPEND',
						amount: Math.abs(event.data.amount),
						balance: 0,
						source: 'traffic_fine',
						metadata: event.data,
					},
				});
				break;
		}
	}

	private extractPlayerMetrics(data: PlayerMetrics): Prisma.PlayerUpdateInput {
		const metrics: Prisma.PlayerUpdateInput = {};
		if (data.money !== undefined) metrics.money = Number(data.money);
		if (data.bank !== undefined) metrics.bank = Number(data.bank);
		if (data.level !== undefined) metrics.level = Number(data.level);
		if (data.xp !== undefined) metrics.experience = Number(data.xp);
		if (data.job !== undefined) metrics.job = String(data.job);
		if (data.playedTime !== undefined) metrics.playedTime = Number(data.playedTime);
		if (data.id !== undefined) metrics.characterId = Number(data.id);
		if (data.thirst !== undefined) metrics.thirst = Number(data.thirst);
		if (data.hunger !== undefined) metrics.hunger = Number(data.hunger);
		if (data.pp !== undefined) metrics.premiumPoints = Number(data.pp);
		if (data.faction !== undefined) metrics.faction = String(data.faction);
		return metrics;
	}
}
