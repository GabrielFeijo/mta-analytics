import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(private configService: ConfigService) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();

        const apiKey = request.headers['x-api-key'];
        const signature = request.headers['x-signature'];
        const hmacSignature = request.headers['x-hmac-signature'];
        const timestamp = request.headers['x-timestamp'];

        if (!apiKey || (!signature && !hmacSignature) || !timestamp) {
            throw new UnauthorizedException('Missing security headers');
        }

        const rawKeys = this.configService.get<string>('MTA_API_KEYS') || '';
        const validKeys = rawKeys
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean);

        if (!validKeys.includes(String(apiKey))) {
            throw new UnauthorizedException('Invalid API key');
        }

        const secret = this.configService.get<string>('MTA_SECRET') || '';
        const payload = `${apiKey}:${timestamp}`;

        const expectedSha256 = crypto
            .createHash('sha256')
            .update(payload)
            .digest('hex');

        const expectedKeyedSha256 = crypto
            .createHash('sha256')
            .update(`${secret}:${payload}`)
            .digest('hex');

        const expectedHmac = crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');

        const provided = String(hmacSignature || signature).toLowerCase();
        const isValid =
            provided === expectedKeyedSha256.toLowerCase() ||
            provided === expectedHmac.toLowerCase() ||
            provided === expectedSha256.toLowerCase() ||
            String(signature || '').toLowerCase() === expectedSha256.toLowerCase();

        if (!isValid) {
            throw new UnauthorizedException('Invalid signature');
        }

        return true;
    }
}
