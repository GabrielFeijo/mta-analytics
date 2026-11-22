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

    async validate(req: Request, payload: AuthJwtPayload) {
        const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        if (!token || (await this.authService.isTokenRevoked(token))) {
            throw new UnauthorizedException('Token revoked or session expired');
        }
        return { userId: payload.sub, username: payload.username, role: payload.role };
    }
}
