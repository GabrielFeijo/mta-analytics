import { Global, Module } from '@nestjs/common';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PrismaService } from './prisma.service';
import { RedisService } from './redis.service';

@Global()
@Module({
    providers: [PrismaService, RedisService, RateLimitGuard, RolesGuard],
    exports: [PrismaService, RedisService, RateLimitGuard, RolesGuard],
})
export class DatabaseModule {}
