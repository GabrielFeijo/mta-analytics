import { Logger, OnModuleDestroy } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
import { AuthJwtPayload, AuthService, hashToken } from '../auth/auth.service';
import { AnalyticsService } from './analytics.service';

interface SocketAuthContext {
    userId: number;
    username: string;
    role: Role;
    token: string;
    tokenHash: string;
    exp?: number;
}

interface ActiveSocketSession {
    socket: Socket;
    userId: number;
    tokenHash: string;
    connectedAt: Date;
}

const MAX_HEATMAP_RANGE_MS = 31 * 24 * 60 * 60 * 1000;

@WebSocketGateway({ namespace: 'analytics' })
export class AnalyticsGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
    @WebSocketServer()
    server: Namespace;

    private readonly logger = new Logger(AnalyticsGateway.name);
    private readonly activeSessions = new Map<string, ActiveSocketSession>();
    private unsubscribeRevocation: (() => void) | null = null;

    constructor(
        private readonly analyticsService: AnalyticsService,
        private readonly jwtService: JwtService,
        private readonly authService: AuthService,
    ) {}

    afterInit(server: Namespace): void {
        server.use(async (socket, next) => {
            try {
                const token = this.extractSocketToken(socket);
                if (!token) {
                    next(new Error('Unauthorized: missing token'));
                    return;
                }

                const payload = await this.jwtService.verifyAsync<AuthJwtPayload>(token);
                const session = await this.authService.resolveActiveSession(token);
                if (!session) {
                    next(new Error('Unauthorized: token revoked or session expired'));
                    return;
                }

                (socket.data as { auth?: SocketAuthContext }).auth = {
                    userId: session.userId,
                    username: session.username,
                    role: session.role,
                    token,
                    tokenHash: hashToken(token),
                    exp: payload.exp,
                };
                next();
            } catch (error) {
                this.logger.warn(
                    `Rejected WebSocket handshake ${socket.id}: ${(error as Error).message}`,
                );
                next(new Error('Unauthorized: invalid token'));
            }
        });

        this.unsubscribeRevocation = this.authService.onTokenRevoked((tokenHash) => {
            this.disconnectByTokenHash(tokenHash);
        });
    }

    onModuleDestroy(): void {
        if (this.unsubscribeRevocation) {
            this.unsubscribeRevocation();
            this.unsubscribeRevocation = null;
        }
    }

    async handleConnection(client: Socket): Promise<void> {
        const auth = (client.data as { auth?: SocketAuthContext }).auth;
        if (!auth) {
            client.disconnect(true);
            return;
        }

        this.activeSessions.set(client.id, {
            socket: client,
            userId: auth.userId,
            tokenHash: auth.tokenHash,
            connectedAt: new Date(),
        });

        try {
            const initialData = await this.analyticsService.getInitialDashboardData();
            client.emit('initial-data', initialData);
        } catch (error) {
            this.logger.warn(
                `Failed to emit initial-data to ${client.id}: ${(error as Error).message}`,
            );
        }
    }

    handleDisconnect(client: Socket): void {
        this.activeSessions.delete(client.id);
    }

    @SubscribeMessage('subscribe:heatmap')
    async handleSubscribeHeatmap(
        @ConnectedSocket() client: Socket,
        @MessageBody()
        filters: { eventType?: string; startDate?: string; endDate?: string; gridSize?: number },
    ) {
        if (!(await this.ensureSocketAuthenticated(client))) {
            return;
        }

        client.join('heatmap-updates');

        const endDate = filters?.endDate ? new Date(filters.endDate) : new Date();
        const startDate = filters?.startDate
            ? new Date(filters.startDate)
            : new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

        if (
            Number.isNaN(startDate.getTime()) ||
            Number.isNaN(endDate.getTime()) ||
            startDate.getTime() > endDate.getTime() ||
            endDate.getTime() - startDate.getTime() > MAX_HEATMAP_RANGE_MS
        ) {
            client.emit('heatmap:error', { message: 'Intervalo de datas inválido.' });
            return;
        }

        const rawGrid = Number(filters?.gridSize);
        const gridSize = Number.isFinite(rawGrid)
            ? Math.min(500, Math.max(10, Math.round(rawGrid)))
            : undefined;

        const heatmapData = await this.analyticsService.getHeatmapData({
            eventType: filters?.eventType,
            startDate,
            endDate,
            gridSize,
        });
        client.emit('heatmap:data', heatmapData);
    }

    @SubscribeMessage('subscribe:players')
    async handleSubscribePlayers(@ConnectedSocket() client: Socket) {
        if (!(await this.ensureSocketAuthenticated(client))) {
            return;
        }

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

    private disconnectByTokenHash(tokenHash: string): void {
        for (const [socketId, session] of this.activeSessions.entries()) {
            if (session.tokenHash === tokenHash) {
                session.socket.disconnect(true);
                this.activeSessions.delete(socketId);
            }
        }
    }

    private async ensureSocketAuthenticated(client: Socket): Promise<boolean> {
        const auth = (client.data as { auth?: SocketAuthContext }).auth;
        if (!auth) {
            client.disconnect(true);
            return false;
        }
        if (auth.exp && auth.exp * 1000 <= Date.now()) {
            client.disconnect(true);
            return false;
        }
        if (await this.authService.isTokenRevoked(auth.token)) {
            client.disconnect(true);
            return false;
        }
        return true;
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
