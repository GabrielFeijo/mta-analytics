import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { PlayerEventZod, PlayerMetrics } from '../../mta/dto/player-event.dto';
import { AnalyticsGateway } from '../analytics.gateway';

@Processor('events')
export class EventProcessor {
	constructor(
		private prisma: PrismaService,
		private gateway: AnalyticsGateway,
	) { }

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

			const createdEvent = await this.prisma.event.create({
				data: {
					eventType: event.eventType,
					playerId: player.id,
					positionX: event.position?.x,
					positionY: event.position?.y,
					positionZ: event.position?.z,
					data: event.data as any,
					timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
				},
				include: {
					player: {
						select: {
							lastUsername: true,
							serial: true,
						},
					},
				},
			});

			if (event.eventType === 'player_join') {
				await this.prisma.playerSession.create({
					data: {
						playerId: player.id,
						loginAt: event.timestamp ? new Date(event.timestamp) : new Date(),
						ip: event.data?.ip ? String(event.data.ip) : undefined,
					},
				});
				this.gateway.broadcastEvent('player:online', { playerId: player.id });
			} else if (event.eventType === 'player_quit') {
				const openSession = await this.prisma.playerSession.findFirst({
					where: { playerId: player.id, logoutAt: null },
					orderBy: { loginAt: 'desc' },
				});
				if (openSession) {
					const logoutAt = event.timestamp ? new Date(event.timestamp) : new Date();
					const durationMin = Math.max(
						1,
						Math.round((logoutAt.getTime() - openSession.loginAt.getTime()) / 60000),
					);
					await Promise.all([
						this.prisma.playerSession.update({
							where: { id: openSession.id },
							data: { logoutAt, duration: durationMin },
						}),
						this.prisma.player.update({
							where: { id: player.id },
							data: { totalPlaytime: { increment: durationMin } },
						}),
					]);
				}
				this.gateway.broadcastEvent('player:offline', { playerId: player.id });
			}

			if (this.isSocialEvent(event)) {
				await this.updatePlayerRelationships(event, player.id);
			}

			if (this.isEconomicEvent(event)) {
				await this.updateEconomicMetrics(event, player.id);
			}

			this.gateway.broadcastEvent('event:new', createdEvent);
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

			case 'player_transaction': {
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

				const type = transTypeMap[event.data.type] || 'SPEND';

				await this.prisma.transaction.create({
					data: {
						playerId,
						type,
						amount: Math.abs(Number(event.data.amount) || 0),
						balance: Number(event.data.money) || 0,
						source: event.data.source_resource || 'bank',
						metadata: event.data,
					},
				});
				break;
			}

			case 'vehicle_purchase':
				await this.prisma.transaction.create({
					data: {
						playerId,
						type: 'SPEND',
						amount: Math.abs(Number(event.data.price) || 0),
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
						amount: Math.abs(Number(event.data.amount) || 0),
						balance: 0,
						source: 'traffic_fine',
						metadata: event.data,
					},
				});
				break;
		}
	}

	private extractPlayerMetrics(data: PlayerMetrics): Record<string, any> {
		const metrics: Record<string, any> = {};
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
