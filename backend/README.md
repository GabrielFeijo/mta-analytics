# MTA Analytics Backend - API de Análise em Tempo Real

API REST e WebSocket em NestJS + Prisma + Bull Queue + Redis para ingestão segura e análise em tempo real de servidores MTA:SA.

## Destaques Técnicos

- **Ingestão Autenticada**: `ApiKeyGuard` com validação de `HMAC-SHA256` (`timestamp.rawBody`) via `timingSafeEqual` e janela anti-replay de 5 minutos.
- **Segurança HTTP & Auth**: `helmet`, `compression`, CORS configurável, rate limiting via Redis (`login`/`register`), RBAC por `Role` e revogação de sessão (`POST /api/auth/logout` + denylist Redis).
- **WebSocket Autenticado**: Gateway Socket.IO (`/analytics`) com validação real de JWT e checagem de revogação.
- **Processamento & Métricas**: Filas Bull (`events` e `metrics`) com retry exponencial, agregações SQL diretas para mapa de calor e balanço econômico, motor de `riskScore` (`0.0–1.0`) e limpeza automática de retenção.

## Instalação Manual

```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

## Scripts

```bash
npm run start:dev       # Dev server com watch
npm run type-check      # Verificação estrita de tipos (tsc --noEmit)
npm run build           # Build TypeScript (dist/)
npm run test            # Testes unitários (node:test)
npm run start:prod      # Produção
npm run prisma:generate # Gerar Prisma Client
npm run prisma:migrate  # Criar/aplicar migrações em dev
npm run prisma:studio   # GUI do banco de dados
```
