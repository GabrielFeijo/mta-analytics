import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
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
    jti?: string;
    exp?: number;
}

export interface ActiveSessionIdentity {
    userId: number;
    username: string;
    role: Role;
    expiresAt: number;
}

const DEFAULT_JWT_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_CACHE_TTL_SECONDS = 60;

const DURATION_MULTIPLIERS_MS: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
};

/**
 * Parses JWT duration strings like `15m`, `24h`, `7d`, `3600s` or numeric seconds into ms.
 */
export function parseDurationToMs(raw: string | undefined, fallbackMs: number): number {
    const trimmed = raw?.trim();
    if (!trimmed) {
        return fallbackMs;
    }
    const match = /^(\d+)\s*(ms|s|m|h|d)?$/i.exec(trimmed);
    if (!match) {
        return fallbackMs;
    }
    const amount = Number(match[1]);
    const unit = (match[2] || 's').toLowerCase();
    const multiplier = DURATION_MULTIPLIERS_MS[unit];
    if (!Number.isFinite(amount) || amount <= 0 || !multiplier) {
        return fallbackMs;
    }
    return amount * multiplier;
}

/**
 * Hashes a raw JWT token into a fixed-length SHA-256 hex digest for storage and Redis keys.
 */
export function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
    private readonly revocationListeners = new Set<(tokenHash: string) => void>();

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly redis: RedisService,
        private readonly configService: ConfigService,
    ) {}

    onTokenRevoked(listener: (tokenHash: string) => void): () => void {
        this.revocationListeners.add(listener);
        return () => {
            this.revocationListeners.delete(listener);
        };
    }

    async login(email: string, password: string) {
        const normalizedEmail = email.trim().toLowerCase();
        const admin = await this.prisma.admin.findUnique({
            where: { email: normalizedEmail },
        });

        if (!admin) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const jti = crypto.randomUUID();
        const payload: AuthJwtPayload = {
            sub: admin.id,
            username: admin.username,
            role: admin.role,
            jti,
        };
        const token = this.jwtService.sign(payload);
        const tokenHash = hashToken(token);
        const expiresInMs = parseDurationToMs(
            this.configService.get<string>('JWT_EXPIRES_IN'),
            DEFAULT_JWT_EXPIRES_MS,
        );
        const expiresAt = new Date(Date.now() + expiresInMs);

        await this.prisma.session.create({
            data: {
                adminId: admin.id,
                token: tokenHash,
                expiresAt,
            },
        });

        await this.cacheActiveSession(tokenHash, {
            userId: admin.id,
            username: admin.username,
            role: admin.role,
            expiresAt: expiresAt.getTime(),
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

        const tokenHash = hashToken(token);
        await this.prisma.session.deleteMany({
            where: {
                OR: [{ token: tokenHash }, { token }],
            },
        });

        const decoded = this.jwtService.decode(token) as AuthJwtPayload | null;
        const ttlSeconds = decoded?.exp
            ? Math.max(60, decoded.exp - Math.floor(Date.now() / 1000))
            : Math.ceil(DEFAULT_JWT_EXPIRES_MS / 1000);

        await this.markTokenHashRevoked(tokenHash, ttlSeconds);
        this.notifyRevocation(tokenHash);

        return { success: true };
    }

    async resolveActiveSession(token: string): Promise<ActiveSessionIdentity | null> {
        if (!token) {
            return null;
        }

        const tokenHash = hashToken(token);

        try {
            if (await this.redis.exists(this.revocationKey(tokenHash))) {
                return null;
            }
            const cachedRaw = await this.redis.get(this.sessionCacheKey(tokenHash));
            if (cachedRaw) {
                const cached = JSON.parse(cachedRaw) as ActiveSessionIdentity;
                if (cached.expiresAt > Date.now()) {
                    return cached;
                }
            }
        } catch {
            // Fall through to DB lookup when Redis is temporarily unavailable
        }

        const session = await this.prisma.session.findFirst({
            where: {
                OR: [{ token: tokenHash }, { token }],
            },
            include: {
                admin: {
                    select: {
                        id: true,
                        username: true,
                        role: true,
                    },
                },
            },
        });

        if (!session || !session.admin || session.expiresAt.getTime() <= Date.now()) {
            return null;
        }

        const identity: ActiveSessionIdentity = {
            userId: session.admin.id,
            username: session.admin.username,
            role: session.admin.role,
            expiresAt: session.expiresAt.getTime(),
        };

        await this.cacheActiveSession(tokenHash, identity);
        return identity;
    }

    async isTokenRevoked(token: string): Promise<boolean> {
        const session = await this.resolveActiveSession(token);
        return session === null;
    }

    async register(username: string, email: string, password: string, authHeader?: string) {
        const normalizedUsername = username.trim();
        const normalizedEmail = email.trim().toLowerCase();
        const allowPublic =
            this.configService.get<string>('ALLOW_PUBLIC_REGISTRATION') === 'true';

        const creatorSession = await this.tryVerifyBearerAdmin(authHeader);
        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            const admin = await this.prisma.$transaction(
                async (tx) => {
                    const existingAdmins = await tx.admin.count();
                    let assignedRole: Role;

                    if (existingAdmins === 0) {
                        assignedRole = Role.ADMIN;
                    } else if (allowPublic) {
                        assignedRole = Role.VIEWER;
                    } else if (!creatorSession) {
                        throw new ForbiddenException(
                            'Registro público desabilitado. Solicite criação por um administrador.',
                        );
                    } else if (creatorSession.role !== Role.ADMIN) {
                        throw new ForbiddenException(
                            'Apenas administradores podem registrar operadores.',
                        );
                    } else {
                        assignedRole = Role.VIEWER;
                    }

                    return tx.admin.create({
                        data: {
                            username: normalizedUsername,
                            email: normalizedEmail,
                            password: hashedPassword,
                            role: assignedRole,
                        },
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            role: true,
                        },
                    });
                },
                { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
            );

            return admin;
        } catch (error) {
            if (error instanceof ForbiddenException) {
                throw error;
            }
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ConflictException('E-mail ou nome de usuário já cadastrado.');
                }
                if (error.code === 'P2034') {
                    throw new ConflictException(
                        'Concorrência detectada durante o registro inicial. Tente novamente.',
                    );
                }
            }
            throw error;
        }
    }

    async listOperators() {
        return this.prisma.admin.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async createOperator(
        username: string,
        email: string,
        password: string,
        role: Role = Role.VIEWER,
    ) {
        const hashedPassword = await bcrypt.hash(password, 10);
        try {
            return await this.prisma.admin.create({
                data: {
                    username: username.trim(),
                    email: email.trim().toLowerCase(),
                    password: hashedPassword,
                    role,
                },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                    createdAt: true,
                },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException('E-mail ou nome de usuário já cadastrado.');
            }
            throw error;
        }
    }

    async updateOperatorRole(id: number, role: Role) {
        const target = await this.prisma.admin.findUnique({
            where: { id },
            select: { id: true, role: true },
        });
        if (!target) {
            throw new NotFoundException(`Operador #${id} não encontrado.`);
        }

        if (target.role === Role.ADMIN && role !== Role.ADMIN) {
            const adminCount = await this.prisma.admin.count({ where: { role: Role.ADMIN } });
            if (adminCount <= 1) {
                throw new BadRequestException('Não é possível rebaixar o único administrador ativo.');
            }
        }

        const updated = await this.prisma.admin.update({
            where: { id },
            data: { role },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                updatedAt: true,
            },
        });

        await this.invalidateUserSessionCaches(id);
        return updated;
    }

    async deleteOperator(id: number, actorId: number) {
        if (id === actorId) {
            throw new BadRequestException('Você não pode excluir a própria conta administrativa.');
        }

        const target = await this.prisma.admin.findUnique({
            where: { id },
            select: { id: true, role: true },
        });
        if (!target) {
            throw new NotFoundException(`Operador #${id} não encontrado.`);
        }

        if (target.role === Role.ADMIN) {
            const adminCount = await this.prisma.admin.count({ where: { role: Role.ADMIN } });
            if (adminCount <= 1) {
                throw new BadRequestException('Não é possível excluir o único administrador ativo.');
            }
        }

        await this.revokeAllUserSessions(id);
        await this.prisma.admin.delete({ where: { id } });
        return { success: true };
    }

    async validateUser(userId: number) {
        const admin = await this.prisma.admin.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
            },
        });
        if (!admin) {
            throw new UnauthorizedException('Operator account no longer exists');
        }
        return admin;
    }

    private async tryVerifyBearerAdmin(authHeader?: string): Promise<ActiveSessionIdentity | null> {
        const bearerToken = authHeader?.startsWith('Bearer ')
            ? authHeader.slice(7).trim()
            : '';
        if (!bearerToken) {
            return null;
        }

        try {
            await this.jwtService.verifyAsync<AuthJwtPayload>(bearerToken);
            const session = await this.resolveActiveSession(bearerToken);
            if (!session) {
                throw new ForbiddenException('Sessão administrativa revogada.');
            }
            return session;
        } catch (err) {
            if (err instanceof ForbiddenException) {
                throw err;
            }
            throw new ForbiddenException('Token administrativo inválido ou expirado.');
        }
    }

    private async invalidateUserSessionCaches(adminId: number): Promise<void> {
        const sessions = await this.prisma.session.findMany({
            where: { adminId },
            select: { token: true },
        });
        if (sessions.length === 0) {
            return;
        }

        try {
            const pipeline = this.redis.pipeline();
            for (const s of sessions) {
                const tokenHash = s.token.length === 64 ? s.token : hashToken(s.token);
                pipeline.del(this.sessionCacheKey(tokenHash));
            }
            await pipeline.exec();
        } catch {
            // Non-fatal cache invalidation
        }
    }

    private async revokeAllUserSessions(adminId: number): Promise<void> {
        const sessions = await this.prisma.session.findMany({
            where: { adminId },
            select: { token: true, expiresAt: true },
        });
        await this.prisma.session.deleteMany({ where: { adminId } });

        const now = Date.now();
        for (const s of sessions) {
            const tokenHash = s.token.length === 64 ? s.token : hashToken(s.token);
            const ttlSeconds = Math.max(60, Math.ceil((s.expiresAt.getTime() - now) / 1000));
            await this.markTokenHashRevoked(tokenHash, ttlSeconds);
            this.notifyRevocation(tokenHash);
        }
    }

    private async cacheActiveSession(
        tokenHash: string,
        identity: ActiveSessionIdentity,
    ): Promise<void> {
        const remainingSeconds = Math.floor((identity.expiresAt - Date.now()) / 1000);
        const ttl = Math.min(SESSION_CACHE_TTL_SECONDS, Math.max(1, remainingSeconds));
        try {
            await this.redis.set(this.sessionCacheKey(tokenHash), JSON.stringify(identity), 'EX', ttl);
        } catch {
            // Non-fatal cache write
        }
    }

    private async markTokenHashRevoked(tokenHash: string, ttlSeconds: number): Promise<void> {
        try {
            const pipeline = this.redis.pipeline();
            pipeline.setex(this.revocationKey(tokenHash), ttlSeconds, '1');
            pipeline.del(this.sessionCacheKey(tokenHash));
            await pipeline.exec();
        } catch {
            // DB session deletion above already invalidates when Redis is offline
        }
    }

    private notifyRevocation(tokenHash: string): void {
        for (const listener of this.revocationListeners) {
            listener(tokenHash);
        }
    }

    private revocationKey(tokenHash: string): string {
        return `revoked:token:${tokenHash}`;
    }

    private sessionCacheKey(tokenHash: string): string {
        return `auth:session:${tokenHash}`;
    }
}
