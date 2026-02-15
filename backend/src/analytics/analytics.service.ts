import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../database/redis.service';

@Injectable()
export class AnalyticsService {
	constructor(
		private prisma: PrismaService,
		private redis: RedisService,
	) {}

	async getInitialDashboardData() {
		const [
			totalPlayers,
			onlinePlayers,
			recentEvents,
			economicSnapshot,
			riskAlerts,
			players24hAgo,
		] = await Promise.all([
			this.prisma.player.count(),
			this.getOnlinePlayersCount(),
			this.getRecentEvents(10),
			this.getEconomicSnapshot(),
			this.prisma.player.count({ where: { riskScore: { gt: 50 } } }),
			this.prisma.player.count({
				where: {
					lastSeen: { lte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
				},
			}),
		]);

		const playerGrowth =
			players24hAgo > 0
				? ((totalPlayers - players24hAgo) / players24hAgo) * 100
				: 0;

		return {
			totalPlayers,
			onlinePlayers,
			recentEvents,
			economicSnapshot,
			riskAlerts,
			trends: {
				playerGrowth: playerGrowth.toFixed(1),
				onlineTrend: '+12%',
			},
			timestamp: Date.now(),
		};
	}

	async getOverviewStats() {
		const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

		const transactions = await this.prisma.transaction.findMany({
			where: {
				timestamp: { gte: sevenDaysAgo },
				type: 'SPEND',
			},
			select: {
				amount: true,
				timestamp: true,
			},
		});

		const dailyStats = new Map<string, number>();
		for (let i = 0; i < 7; i++) {
			const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
			const key = date.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
			});
			dailyStats.set(key, 0);
		}

		transactions.forEach((tx) => {
			const key = new Date(tx.timestamp).toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
			});
			if (dailyStats.has(key)) {
				dailyStats.set(key, dailyStats.get(key)! + tx.amount);
			}
		});

		return Array.from(dailyStats.entries())
			.reverse()
			.map(([name, total]) => ({
				name,
				total,
			}));
	}

	async getOnlinePlayersCount(): Promise<number> {
		const cached = await this.redis.get('metrics:online_players');
		if (cached) return parseInt(cached);

		const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
		const count = await this.prisma.player.count({
			where: {
				lastSeen: {
					gte: fiveMinutesAgo,
				},
			},
		});

		await this.redis.set('metrics:online_players', count.toString(), 'EX', 30);
		return count;
	}

	async getOnlinePlayers() {
		const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

		return this.prisma.player.findMany({
			where: {
				lastSeen: {
					gte: fiveMinutesAgo,
				},
			},
			select: {
				id: true,
				serial: true,
				lastUsername: true,
				lastSeen: true,
				riskScore: true,
			},
			orderBy: {
				lastSeen: 'desc',
			},
		});
	}

	async getRecentEvents(limit: number = 50) {
		return this.prisma.event.findMany({
			take: limit,
			orderBy: {
				timestamp: 'desc',
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
	}

	async getEconomicSnapshot() {
		const latest = await this.prisma.economicMetric.findFirst({
			orderBy: {
				timestamp: 'desc',
			},
		});

		if (!latest) {
			return {
				totalMoney: 0,
				moneyInCirc: 0,
				avgPlayerWealth: 0,
				inflationRate: 0,
			};
		}

		return {
			totalMoney: latest.totalMoney,
			moneyInCirc: latest.moneyInCirc,
			avgPlayerWealth: latest.avgPlayerWealth,
			inflationRate: latest.inflationRate || 0,
		};
	}

	async getHeatmapData(filters: {
		eventType: string;
		startDate: Date;
		endDate: Date;
	}) {
		const events = await this.prisma.event.findMany({
			where: {
				eventType: filters.eventType,
				timestamp: {
					gte: filters.startDate,
					lte: filters.endDate,
				},
				positionX: { not: null },
				positionY: { not: null },
			},
			select: {
				positionX: true,
				positionY: true,
				positionZ: true,
			},
		});

		const gridSize = 50;
		const heatmap = new Map<string, number>();

		events.forEach((event) => {
			const gridX = Math.floor(event.positionX / gridSize);
			const gridY = Math.floor(event.positionY / gridSize);
			const key = `${gridX},${gridY}`;

			heatmap.set(key, (heatmap.get(key) || 0) + 1);
		});

		const maxIntensity = Math.max(...heatmap.values());

		return Array.from(heatmap.entries()).map(([key, count]) => {
			const [x, y] = key.split(',').map(Number);
			return {
				x: x * gridSize,
				y: y * gridSize,
				intensity: count / maxIntensity,
				count,
			};
		});
	}

	async getPlayerActivityTimeline(playerId: number, hours: number = 24) {
		const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

		const events = await this.prisma.event.findMany({
			where: {
				playerId,
				timestamp: {
					gte: startDate,
				},
			},
			orderBy: {
				timestamp: 'asc',
			},
			select: {
				id: true,
				timestamp: true,
				eventType: true,
				positionX: true,
				positionY: true,
				positionZ: true,
				data: true,
			},
		});

		return events;
	}
	async getResourceStats(hours: number = 24) {
		const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

		const transactions = await this.prisma.transaction.findMany({
			where: {
				timestamp: {
					gte: startDate,
				},
				type: 'SPEND',
				OR: [
					{ source: 'carshop' },
					{ source: 'shop_purchase' },
					{ source: { contains: 'shop' } },
					{ source: { contains: 'vehicle' } },
				],
			},
			include: {
				player: {
					select: {
						lastUsername: true,
					},
				},
			},
			orderBy: {
				timestamp: 'desc',
			},
		});

		const vehicleSales = transactions.filter(
			(tx) =>
				tx.source === 'carshop' ||
				tx.source?.includes('vehicle') ||
				(tx.metadata as any)?.model,
		);

		const shopSales = transactions.filter(
			(tx) =>
				tx.source === 'shop_purchase' ||
				(tx.source?.includes('shop') && tx.source !== 'carshop'),
		);

		const totalRevenue = transactions.reduce((acc, tx) => acc + tx.amount, 0);

		return {
			vehicleSales: vehicleSales.map((tx) => ({
				id: tx.id.toString(),
				player: tx.player.lastUsername,
				amount: tx.amount,
				vehicleName: (tx.metadata as any)?.vehicleName || 'Unknown Vehicle',
				timestamp: tx.timestamp,
			})),
			shopSales: shopSales.map((tx) => ({
				id: tx.id.toString(),
				player: tx.player.lastUsername,
				amount: tx.amount,
				itemName: (tx.metadata as any)?.description || 'Unknown Item',
				timestamp: tx.timestamp,
			})),
			stats: {
				totalRevenue,
				vehicleRevenue: vehicleSales.reduce((acc, tx) => acc + tx.amount, 0),
				shopRevenue: shopSales.reduce((acc, tx) => acc + tx.amount, 0),
				totalTransactions: transactions.length,
				vehicleCount: vehicleSales.length,
				shopCount: shopSales.length,
			},
		};
	}
}
