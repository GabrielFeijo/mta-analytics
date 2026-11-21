# MTA Analytics - Dashboard de Inteligência para Servidores

> Plataforma full-stack de análise e monitoramento em tempo real para servidores MTA (Multi Theft Auto), com ingestão segura via HMAC-SHA256, processamento assíncrono em fila Bull/Redis, WebSocket autenticado e dashboard Garage Night.

## Sobre o Projeto

O **MTA Analytics** fornece inteligência operacional para servidores de roleplay MTA, cobrindo auditoria econômica, rastreamento de jogadores, mapa de calor espacial de San Andreas, radar de multas, movimentação de lojas/corridas (`mta_racing`) e pontuação de risco (`riskScore` em `0.0–1.0`).

### Destaques Técnicos

- **Coletor Lua 100% Server-Side**: Credenciais isoladas no servidor, serialização JSON segura, agregação de rajadas de dano, HMAC-SHA256 RFC 2104 e Circuit Breaker com backoff exponencial.
- **Backend NestJS + PostgreSQL + Redis**: Ingestão em lote via Bull Queue, queries espaciais e financeiras agregadas diretamente em SQL, rate limiting, revogação de JWT e retenção automática de dados.
- **Frontend React + Vite (`kebab-case`)**: Conexão Socket.IO única via Context, componentes reutilizáveis, busca com debounce, drawer responsivo para mobile e Modo Snapshot Local isolado.

## Início Rápido

### Banco de Dados e Cache (Docker)

```bash
cd backend
docker-compose up -d
```

### Backend

```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:3000/api](http://localhost:3000/api)
- WebSocket: `ws://localhost:3000/analytics`

## Estrutura do Projeto (`kebab-case`)

```text
mta-analytics/
├── backend/
│   ├── docker-compose.yml
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── src/
│       ├── app.module.ts
│       ├── main.ts
│       ├── analytics/
│       │   ├── analytics.controller.ts
│       │   ├── analytics.gateway.ts
│       │   ├── analytics.module.ts
│       │   ├── analytics.service.ts
│       │   ├── dto/analytics-query.dto.ts
│       │   ├── processors/
│       │   │   ├── event-mapper.ts
│       │   │   ├── event.processor.ts
│       │   │   └── metric.processor.ts
│       │   └── services/
│       │       ├── dashboard-analytics.service.ts
│       │       ├── economy-metrics.service.ts
│       │       ├── heatmap-analytics.service.ts
│       │       ├── resource-fines-analytics.service.ts
│       │       └── risk-scoring.service.ts
│       ├── auth/
│       ├── common/
│       │   ├── config/env.validation.ts
│       │   ├── decorators/
│       │   └── guards/
│       ├── database/
│       ├── economy/
│       ├── mta/
│       └── players/
├── frontend/
│   └── src/
│       ├── app.tsx
│       ├── main.tsx
│       ├── components/
│       │   ├── common/
│       │   ├── dashboard/
│       │   ├── economy/
│       │   ├── layout/
│       │   ├── players/
│       │   └── ui/
│       ├── contexts/analytics-socket-context.tsx
│       ├── hooks/
│       ├── lib/
│       ├── mocks/telemetry-snapshot.ts
│       ├── pages/
│       ├── services/
│       ├── stores/
│       ├── styles/
│       └── types/telemetry.ts
└── mta_analytics_resource/
    ├── meta.xml
    └── server/
        ├── config.lua
        ├── main.lua
        ├── collectors/
        └── core/
```

## Scripts Principais

```bash
# Backend
cd backend && npm run type-check && npm run build && npm test

# Frontend
cd frontend && npm run type-check && npm run build
```
