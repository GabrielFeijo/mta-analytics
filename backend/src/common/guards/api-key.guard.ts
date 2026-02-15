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
        const timestamp = request.headers['x-timestamp'];

        if (!apiKey || !signature || !timestamp) {
            console.log('Deu erro aqui Validar presença dos headers')
            throw new UnauthorizedException('Missing security headers');
        }

        const now = Date.now();
        const requestTime = parseInt(timestamp);

        if (isNaN(requestTime) || Math.abs(now - requestTime) > 30000) {
            console.log('Deu erro aqui Validar timestamp (previne replay attacks - janela de 30s)',)
            throw new UnauthorizedException('Request expired or invalid timestamp');
        }

        const validKeys = this.configService
            .get<string>('MTA_API_KEYS')
            .split(',');

        if (!validKeys.includes(apiKey)) {
            console.log('Deu erro aqui  Validar API Key',)
            throw new UnauthorizedException('Invalid API key');
        }

        const secret = this.configService.get<string>('MTA_SECRET');
        const payload = `${apiKey}:${timestamp}`;

        const expectedSignature = crypto
            .createHash('sha256')
            .update(payload)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.log('Deu erro aqui Validar assinatura HMAC',)
            throw new UnauthorizedException('Invalid signature');
        }

        console.log("Deu certo")

        return true;
    }
}
