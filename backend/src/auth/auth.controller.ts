import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto.username, loginDto.password);
    }

    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(
            registerDto.username,
            registerDto.email,
            registerDto.password,
        );
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Request() req) {
        return this.authService.validateUser(req.user.userId);
    }
}
