import {
    ConflictException,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../database/redis.service';

export interface AuthJwtPayload {
    sub: number;
    username: string;
    role: Role;
    exp?: number;
}

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly redis: RedisService,
        private readonly configService: ConfigService,
    ) {}

    async login(email: string, password: string) {
        const admin = await this.prisma.admin.findUnique({
            where: { email },
        });

        if (!admin) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { sub: admin.id, username: admin.username, role: admin.role };
        const token = this.jwtService.sign(payload);

        await this.prisma.session.create({
            data: {
                adminId: admin.id,
                token,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        return {
            access_token: token,
            user: {
                id: admin.id,
                username: admin.username,
                email: admin.email,
                role: admin.role,
            },
        };
    }

    async logout(token: string): Promise<{ success: boolean }> {
        if (!token) {
            return { success: true };
        }

        await this.prisma.session.deleteMany({
            where: { token },
        });

        const decoded = this.jwtService.decode(token) as AuthJwtPayload | null;
        const ttlSeconds = decoded?.exp
            ? Math.max(60, decoded.exp - Math.floor(Date.now() / 1000))
            : 7 * 24 * 60 * 60;

        try {
            await this.redis.set(this.revocationKey(token), '1', 'EX', ttlSeconds);
        } catch {
            // DB session deletion above already invalidates when Redis is offline
        }

        return { success: true };
    }

    async isTokenRevoked(token: string): Promise<boolean> {
        try {
            if (await this.redis.exists(this.revocationKey(token))) {
                return true;
            }
        } catch {
            // Fall through to DB check if Redis is temporarily unavailable
        }

        const session = await this.prisma.session.findUnique({
            where: { token },
            select: { id: true, expiresAt: true },
        });
        return !session || session.expiresAt.getTime() <= Date.now();
    }

    async register(username: string, email: string, password: string, authHeader?: string) {
        const assignedRole = await this.resolveRegistrationRole(authHeader);
        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            const admin = await this.prisma.admin.create({
                data: {
                    username,
                    email,
                    password: hashedPassword,
                    role: assignedRole,
                },
            });

            return {
                id: admin.id,
                username: admin.username,
                email: admin.email,
                role: admin.role,
            };
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException('E-mail ou nome de usuário já cadastrado.');
            }
            throw error;
        }
    }

    async validateUser(userId: number) {
        return this.prisma.admin.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
            },
        });
    }

    private async resolveRegistrationRole(authHeader?: string): Promise<Role> {
        const existingAdmins = await this.prisma.admin.count();
        if (existingAdmins === 0) {
            return Role.ADMIN;
        }

        const allowPublic =
            this.configService.get<string>('ALLOW_PUBLIC_REGISTRATION') === 'true';
        if (allowPublic) {
            return Role.VIEWER;
        }

        const bearerToken = authHeader?.startsWith('Bearer ')
            ? authHeader.slice(7).trim()
            : '';

        if (!bearerToken) {
            throw new ForbiddenException(
                'Registro público desabilitado. Solicite criação por um administrador.',
            );
        }

        try {
            const payload = await this.jwtService.verifyAsync<AuthJwtPayload>(bearerToken);
            if (await this.isTokenRevoked(bearerToken)) {
                throw new ForbiddenException('Sessão administrativa revogada.');
            }
            if (payload.role !== Role.ADMIN) {
                throw new ForbiddenException('Apenas administradores podem registrar operadores.');
            }
            return Role.VIEWER;
        } catch (err) {
            if (err instanceof ForbiddenException) {
                throw err;
            }
            throw new ForbiddenException('Token administrativo inválido ou expirado.');
        }
    }

    private revocationKey(token: string): string {
        const digest = crypto.createHash('sha256').update(token).digest('hex');
        return `revoked:token:${digest}`;
    }
}
