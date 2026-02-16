import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

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
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
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

    async register(username: string, email: string, password: string) {
        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await this.prisma.admin.create({
            data: {
                username,
                email,
                password: hashedPassword,
            },
        });

        return {
            id: admin.id,
            username: admin.username,
            email: admin.email,
            role: admin.role,
        };
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
}
