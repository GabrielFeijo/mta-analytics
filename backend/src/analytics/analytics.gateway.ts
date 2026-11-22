import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthJwtPayload, AuthService } from '../auth/auth.service';
import { AnalyticsService } from './analytics.service';

@WebSocketGateway({
    cors: {
        origin: (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173')
            .split(',')
            .map((o) => o.trim())
            .filter(Boolean),
        credentials: true,
    },
    namespace: 'analytics',
})
export class AnalyticsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(AnalyticsGateway.name);
    private readonly activeSessions = new Map<string, { socketId: string; userId: number; connectedAt: Date }>();

    constructor(
        private readonly analyticsService: AnalyticsService,
        private readonly jwtService: JwtService,
        private readonly authService: AuthService,
    ) {}

    async handleConnection(client: Socket): Promise<void> {
        try {
            const token = this.extractSocketToken(client);
            if (!token) {
                client.disconnect();
                return;
            }

            const payload = await this.jwtService.verifyAsync<AuthJwtPayload>(token);
            if (await this.authService.isTokenRevoked(token)) {
                client.disconnect();
                return;
            }

            this.activeSessions.set(client.id, {
                socketId: client.id,
                userId: payload.sub,
                connectedAt: new Date(),
            });

            const initialData = await this.analyticsService.getInitialDashboardData();
            client.emit('initial-data', initialData);
        } catch (error) {
            this.logger.warn(`Rejected WebSocket connection ${client.id}: ${(error as Error).message}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket): void {
        this.activeSessions.delete(client.id);
    }

    @SubscribeMessage('subscribe:heatmap')
    async handleSubscribeHeatmap(
        @ConnectedSocket() client: Socket,
        @MessageBody() filters: { eventType?: string; startDate?: string; endDate?: string; gridSize?: number },
    ) {
        client.join('heatmap-updates');

        const endDate = filters?.endDate ? new Date(filters.endDate) : new Date();
        const startDate = filters?.startDate
            ? new Date(filters.startDate)
            : new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
            client.emit('heatmap:error', { message: 'Intervalo de datas inválido.' });
            return;
        }

        const heatmapData = await this.analyticsService.getHeatmapData({
            eventType: filters?.eventType,
            startDate,
            endDate,
            gridSize: filters?.gridSize,
        });
        client.emit('heatmap:data', heatmapData);
    }

    @SubscribeMessage('subscribe:players')
    async handleSubscribePlayers(@ConnectedSocket() client: Socket) {
        client.join('player-updates');
        const players = await this.analyticsService.getOnlinePlayers();
        client.emit('players:list', players);
    }

    broadcastEvent(eventType: string, data: unknown): void {
        if (!this.server) {
            return;
        }
        const payload =
            typeof data === 'object' && data !== null
                ? { timestamp: Date.now(), ...(data as Record<string, unknown>) }
                : { timestamp: Date.now(), data };
        this.server.emit(eventType, payload);
    }

    broadcastToRoom(room: string, eventType: string, data: unknown): void {
        if (!this.server) {
            return;
        }
        const payload =
            typeof data === 'object' && data !== null
                ? { timestamp: Date.now(), ...(data as Record<string, unknown>) }
                : { timestamp: Date.now(), data };
        this.server.to(room).emit(eventType, payload);
    }

    private extractSocketToken(client: Socket): string {
        const authToken = client.handshake.auth?.token;
        if (typeof authToken === 'string' && authToken.trim()) {
            return authToken.trim();
        }
        const header = client.handshake.headers?.authorization;
        if (typeof header === 'string' && header.startsWith('Bearer ')) {
            return header.slice(7).trim();
        }
        return '';
    }
}
