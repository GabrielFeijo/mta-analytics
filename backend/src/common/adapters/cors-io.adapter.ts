import { INestApplicationContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions } from 'socket.io';
import { resolveCorsSettings } from '../config/env.validation';

/**
 * Socket.IO adapter that resolves CORS settings dynamically from ConfigService
 * after ConfigModule has loaded `.env`.
 */
export class CorsIoAdapter extends IoAdapter {
    private readonly configService: ConfigService;

    constructor(app: INestApplicationContext) {
        super(app);
        this.configService = app.get(ConfigService);
    }

    override createIOServer(port: number, options?: Partial<ServerOptions>): Server {
        const cors = resolveCorsSettings(
            this.configService.get<string>('CORS_ORIGIN') ||
                this.configService.get<string>('FRONTEND_URL'),
            this.configService.get<string>('NODE_ENV'),
        );

        return super.createIOServer(port, {
            ...(options ?? {}),
            cors,
        }) as Server;
    }
}
