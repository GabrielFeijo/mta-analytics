import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AnalyticsService } from './analytics.service';

@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    },
    namespace: 'analytics',
})
export class AnalyticsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private activeSessions = new Map<string, any>();

    constructor(private analyticsService: AnalyticsService) { }

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth.token;

            if (!token) {
                client.disconnect();
                return;
            }

            // TODO: Validar JWT
            // const user = await this.authService.validateToken(token);

            this.activeSessions.set(client.id, {
                socketId: client.id,
                connectedAt: new Date(),
            });

            console.log(`Client connected: ${client.id}`);
            console.log(`Active sessions: ${this.activeSessions.size}`);

            const initialData = await this.analyticsService.getInitialDashboardData();
            client.emit('initial-data', initialData);

        } catch (error) {
            console.error('Connection error:', error);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        this.activeSessions.delete(client.id);
        console.log(`Client disconnected: ${client.id}`);
        console.log(`Active sessions: ${this.activeSessions.size}`);
    }

    @SubscribeMessage('subscribe:heatmap')
    async handleSubscribeHeatmap(
        @ConnectedSocket() client: Socket,
        @MessageBody() filters: any,
    ) {
        client.join('heatmap-updates');

        const heatmapData = await this.analyticsService.getHeatmapData(filters);
        client.emit('heatmap:data', heatmapData);
    }

    @SubscribeMessage('subscribe:players')
    async handleSubscribePlayers(@ConnectedSocket() client: Socket) {
        client.join('player-updates');

        const players = await this.analyticsService.getOnlinePlayers();
        client.emit('players:list', players);
    }

    broadcastEvent(eventType: string, data: any) {
        this.server.emit(eventType, {
            timestamp: Date.now(),
            ...data,
        });
    }

    broadcastToRoom(room: string, eventType: string, data: any) {
        this.server.to(room).emit(eventType, {
            timestamp: Date.now(),
            ...data,
        });
    }
}
