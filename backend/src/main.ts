import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { validateEnvironment } from './common/config/env.validation';

function parseCorsOrigins(rawOrigin?: string): string[] | boolean {
    if (!rawOrigin || rawOrigin.trim() === '*') {
        return rawOrigin?.trim() === '*' ? true : ['http://localhost:5173'];
    }
    const origins = rawOrigin
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    return origins.length > 0 ? origins : ['http://localhost:5173'];
}

async function bootstrap(): Promise<void> {
    validateEnvironment();

    (BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
        return this.toString();
    };

    const logger = new Logger('Bootstrap');
    const app = await NestFactory.create(AppModule, { rawBody: true });
    const configService = app.get(ConfigService);

    app.use(helmet());
    app.use(compression());

    const corsOrigin = parseCorsOrigins(
        configService.get<string>('CORS_ORIGIN') || configService.get<string>('FRONTEND_URL'),
    );
    app.enableCors({
        origin: corsOrigin,
        credentials: true,
    });

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
