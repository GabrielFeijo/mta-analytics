import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthJwtPayload, AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        configService: ConfigService,
        private readonly authService: AuthService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || '',
            passReqToCallback: true,
        });
    }

    async validate(req: Request, _payload: AuthJwtPayload) {
        const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        if (!token) {
            throw new UnauthorizedException('Missing authentication token');
        }
        const session = await this.authService.resolveActiveSession(token);
        if (!session) {
            throw new UnauthorizedException('Token revoked or session expired');
        }
        return {
            userId: session.userId,
            username: session.username,
            role: session.role,
        };
    }
}
