import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { validateEnvironment } from './common/config/env.validation';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { MtaModule } from './mta/mta.module';
import { PlayersModule } from './players/players.module';
import { EconomyModule } from './economy/economy.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
            validate: validateEnvironment,
        }),
        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                redis: {
                    host: configService.get<string>('REDIS_HOST') || 'localhost',
                    port: parseInt(configService.get<string>('REDIS_PORT') || '6379', 10) || 6379,
                    password: configService.get<string>('REDIS_PASSWORD') || undefined,
                },
            }),
        }),
        DatabaseModule,
        HealthModule,
        AuthModule,
        AnalyticsModule,
        MtaModule,
        PlayersModule,
        EconomyModule,
    ],
})
export class AppModule {}
