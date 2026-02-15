import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { PlayerEventZod } from '../../mta/dto/player-event.dto';

@Processor('events')
export class EventProcessor {
	constructor(private prisma: PrismaService) {}

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
				},
			});

			await this.prisma.event.create({
				data: {
					eventType: event.eventType,
					playerId: player.id,
					positionX: event.position?.x,
					positionY: event.position?.y,
					positionZ: event.position?.z,
					data: event.data as any,
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
		if (event.eventType === 'player_money_change' && event.data.amount) {
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
		} else if (event.eventType === 'player_transaction') {
			const transTypeMap: Record<
				string,
				'EARN' | 'SPEND' | 'TRANSFER_IN' | 'TRANSFER_OUT'
			> = {
				deposit: 'SPEND',
				withdraw: 'EARN',
				transfer_sent: 'TRANSFER_OUT',
				transfer_received: 'TRANSFER_IN',
				shop_purchase: 'SPEND',
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
		} else if (event.eventType === 'vehicle_purchase') {
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
		}
	}
}
