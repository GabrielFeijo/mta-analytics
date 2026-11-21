import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const MAX_TIMESTAMP_SKEW_MS = 5 * 60 * 1000;

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(private readonly configService: ConfigService) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();

        const apiKey = this.readHeader(request.headers['x-api-key']);
        const hmacSignature = this.readHeader(request.headers['x-hmac-signature']);
        const timestampRaw = this.readHeader(request.headers['x-timestamp']);

        if (!apiKey || !hmacSignature || !timestampRaw) {
            throw new UnauthorizedException('Missing security headers');
        }

        if (!this.isTimestampFresh(timestampRaw)) {
            throw new UnauthorizedException('Request timestamp expired or invalid');
        }

        if (!this.isValidApiKey(apiKey)) {
            throw new UnauthorizedException('Invalid API key');
        }

        const rawBody = this.resolveRawBody(request);
        const secret = this.configService.get<string>('MTA_SECRET') || '';
        const expectedHmac = crypto
            .createHmac('sha256', secret)
            .update(`${timestampRaw}.${rawBody}`)
            .digest('hex');

        if (!this.safeHexEquals(hmacSignature, expectedHmac)) {
            throw new UnauthorizedException('Invalid HMAC signature');
        }

        request.serverId = apiKey;
        return true;
    }

    private readHeader(value: string | string[] | undefined): string {
        if (Array.isArray(value)) {
            return (value[0] || '').trim();
        }
        return typeof value === 'string' ? value.trim() : '';
    }

    private isTimestampFresh(timestampRaw: string): boolean {
        const timestampMs = Number(timestampRaw);
        if (!Number.isFinite(timestampMs) || timestampMs <= 0) {
            return false;
        }
        return Math.abs(Date.now() - timestampMs) <= MAX_TIMESTAMP_SKEW_MS;
    }

    private isValidApiKey(providedKey: string): boolean {
        const rawKeys = this.configService.get<string>('MTA_API_KEYS') || '';
        const validKeys = rawKeys
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean);

        const providedBuf = Buffer.from(providedKey, 'utf8');
        return validKeys.some((candidate) => {
            const candidateBuf = Buffer.from(candidate, 'utf8');
            return (
                providedBuf.length === candidateBuf.length &&
                crypto.timingSafeEqual(providedBuf, candidateBuf)
            );
        });
    }

    private resolveRawBody(request: any): string {
        if (Buffer.isBuffer(request.rawBody)) {
            return request.rawBody.toString('utf8');
        }
        if (typeof request.rawBody === 'string') {
            return request.rawBody;
        }
        return request.body ? JSON.stringify(request.body) : '';
    }

    private safeHexEquals(provided: string, expected: string): boolean {
        const providedBuf = Buffer.from(provided.toLowerCase(), 'utf8');
        const expectedBuf = Buffer.from(expected.toLowerCase(), 'utf8');
        if (providedBuf.length !== expectedBuf.length) {
            return false;
        }
        return crypto.timingSafeEqual(providedBuf, expectedBuf);
    }
}
