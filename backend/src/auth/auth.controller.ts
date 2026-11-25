import {
    Body,
    Controller,
    Delete,
    Get,
    Headers,
    HttpCode,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Request,
    UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import {
    CreateOperatorDto,
    LoginDto,
    RegisterDto,
    UpdateOperatorRoleDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RateLimit } from '../common/decorators/rate-limit.decorator';
import { Roles } from '../common/decorators/roles.decorator';

interface AuthenticatedRequest {
    user: {
        userId: number;
        username: string;
        role: Role;
    };
}

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @HttpCode(200)
    @UseGuards(RateLimitGuard)
    @RateLimit({ limit: 10, ttlSeconds: 60 })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto.email, loginDto.password);
    }

    @Post('register')
    @UseGuards(RateLimitGuard)
    @RateLimit({ limit: 5, ttlSeconds: 60 })
    async register(
        @Body() registerDto: RegisterDto,
        @Headers('authorization') authHeader?: string,
    ) {
        return this.authService.register(
            registerDto.username,
            registerDto.email,
            registerDto.password,
            authHeader,
        );
    }

    @Post('logout')
    @HttpCode(200)
    @UseGuards(JwtAuthGuard)
    async logout(@Headers('authorization') authHeader?: string) {
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
        return this.authService.logout(token);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Request() req: AuthenticatedRequest) {
        return this.authService.validateUser(req.user.userId);
    }

    @Get('operators')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async listOperators() {
        return this.authService.listOperators();
    }

    @Post('operators')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async createOperator(@Body() dto: CreateOperatorDto) {
        return this.authService.createOperator(dto.username, dto.email, dto.password, dto.role);
    }

    @Patch('operators/:id/role')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async updateOperatorRole(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateOperatorRoleDto,
    ) {
        return this.authService.updateOperatorRole(id, dto.role);
    }

    @Delete('operators/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async deleteOperator(
        @Param('id', ParseIntPipe) id: number,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.authService.deleteOperator(id, req.user.userId);
    }
}
