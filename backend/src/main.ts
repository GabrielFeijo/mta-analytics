import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { CorsIoAdapter } from './common/adapters/cors-io.adapter';
import { resolveCorsSettings } from './common/config/env.validation';

function configureTrustProxy(app: NestExpressApplication, rawValue?: string): void {
    const trimmed = rawValue?.trim();
    if (!trimmed || trimmed.toLowerCase() === 'false') {
        return;
    }
    if (trimmed.toLowerCase() === 'true') {
        app.set('trust proxy', true);
        return;
    }
    const hops = Number(trimmed);
    app.set('trust proxy', Number.isInteger(hops) && hops >= 0 ? hops : trimmed);
}

async function bootstrap(): Promise<void> {
    (BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
        return this.toString();
    };

    const logger = new Logger('Bootstrap');
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        rawBody: true,
        bodyParser: false,
    });
    const configService = app.get(ConfigService);

    app.useBodyParser('json', { limit: '1mb' });
    app.useBodyParser('urlencoded', { limit: '1mb', extended: true });
    configureTrustProxy(app, configService.get<string>('TRUST_PROXY'));
    app.enableShutdownHooks();

    app.use(helmet());
    app.use(compression());

    const corsSettings = resolveCorsSettings(
        configService.get<string>('CORS_ORIGIN') || configService.get<string>('FRONTEND_URL'),
        configService.get<string>('NODE_ENV'),
    );
    app.enableCors(corsSettings);
    app.useWebSocketAdapter(new CorsIoAdapter(app));

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    app.setGlobalPrefix('api');

    const port = Number(configService.get<string>('PORT')) || 3000;
    await app.listen(port, '0.0.0.0');

    logger.log(`Backend running on: http://localhost:${port}`);
    logger.log(`Analytics WebSocket: ws://localhost:${port}/analytics`);
}

bootstrap();
