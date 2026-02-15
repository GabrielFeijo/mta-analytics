import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';

async function bootstrap() {
    (BigInt.prototype as any).toJSON = function () {
        return this.toString();
    };

    const app = await NestFactory.create(AppModule, {
        cors: true,
    });

    const configService = app.get(ConfigService);

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

    const port = configService.get('PORT') || 3000;
    await app.listen(port, '0.0.0.0');

    console.log(`🚀 Backend running on: http://localhost:${port}`);
    console.log(`📊 Analytics WebSocket: ws://localhost:${port}/analytics`);
}

bootstrap();
