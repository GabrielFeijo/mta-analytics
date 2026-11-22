# ⚙️ MTA Analytics Backend (`backend`)

> API REST e WebSocket em **NestJS + Prisma + PostgreSQL + Bull Queue + Redis** para ingestão segura de telemetria MTA:SA, processamento assíncrono, agregações espaciais/financeiras em SQL nativo e avaliação contínua de risco (`0.0–1.0`).

[![NestJS](https://img.shields.io/badge/NestJS-10.3-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.8-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Bull](https://img.shields.io/badge/Bull-4.12-F59E0B?style=flat)](https://github.com/OptimalBits/bull)

---

## 🎯 Destaques

- **Ingestão Autenticada via HMAC-SHA256 & Anti-Replay**: [`ApiKeyGuard`](src/common/guards/api-key.guard.ts) exige `x-api-key`, `x-timestamp` (janela máxima de `±5` minutos) e `x-hmac-signature` validado com `crypto.timingSafeEqual` sobre `${timestamp}.${rawBody}`, injetando `serverId` na requisição para rastreamento multi-servidor.
- **Segurança HTTP, Auth & WebSocket**: [`main.ts`](src/main.ts) habilita `rawBody`, `helmet`, `compression`, CORS por `CORS_ORIGIN` e validação fail-fast via [`env.validation.ts`](src/common/config/env.validation.ts); [`AuthService`](src/auth/auth.service.ts) aplica rate limiting em Redis ([`RateLimitGuard`](src/common/guards/rate-limit.guard.ts)), RBAC ([`RolesGuard`](src/common/guards/roles.guard.ts)), bootstrap automático do primeiro `ADMIN` e revogação real de tokens em `POST /api/auth/logout`; [`AnalyticsGateway`](src/analytics/analytics.gateway.ts) valida JWT e revogação na conexão Socket.IO.
- **Arquitetura SRP & SQL Otimizado**: o módulo Analytics separa responsabilidades em 5 serviços especializados (`dashboard-analytics`, `economy-metrics`, `heatmap-analytics`, `resource-fines-analytics` e `risk-scoring`), substituindo leituras em memória por queries SQL nativas (`FLOOR("positionX" / gridSize)`, `DATE_TRUNC('day', timestamp)` e `SUM(money + bank)`).
- **Motor de Risco (`0.0–1.0`) & Retenção Automática**: [`RiskScoringService`](src/analytics/services/risk-scoring.service.ts) recalcula o score de anomalia por transação atípica, dinheiro sujo elevado, multas e combate; [`MetricProcessor`](src/analytics/processors/metric.processor.ts) publica snapshots horários (`economy:update`) e executa limpeza diária às 03:00 (`EVENT_RETENTION_DAYS`).

---

## 🔐 Variáveis de Ambiente ([`.env.example`](.env.example))

| Variável | Obrigatória | Descrição |
| :--- | :--- | :--- |
| `DATABASE_URL` | Sim | String de conexão PostgreSQL utilizada pelo Prisma |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Sim | Conexão Redis para Bull Queue, cache, heartbeat e rate limiting |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Sim | Chave e expiração dos tokens JWT do painel administrativo |
| `MTA_API_KEYS` / `MTA_SECRET` | Sim | Chaves válidas (separadas por vírgula) e segredo compartilhado HMAC-SHA256 |
| `ALLOW_PUBLIC_REGISTRATION` | Não | `false` por padrão (apenas `ADMIN` registra novos operadores após o 1º cadastro) |
| `EVENT_RETENTION_DAYS` | Não | Dias de retenção de eventos `player_position` antes do prune diário (padrão `14`) |
| `CORS_ORIGIN` / `FRONTEND_URL` / `PORT` | Não | Origens permitidas no CORS/Socket.IO e porta HTTP (padrão `3000`) |

---

## 📦 Estrutura do Projeto

```text
backend/
├── prisma/
│   ├── migrations/
│   │   ├── 20260215012801_initial_migration/      # Estrutura base de tabelas e índices
│   │   ├── 20260216011204_add_player_detail/      # Campos de perfil do gamemode em players
│   │   └── 20261121000000_add_dirty_money_and_indexes/ # Campo dirtyMoney e índices de consulta
│   └── schema.prisma                              # Schema Prisma ORM
├── src/
│   ├── analytics/
│   │   ├── dto/analytics-query.dto.ts             # HeatmapQueryDto, HoursQueryDto e LimitQueryDto
│   │   ├── processors/
│   │   │   ├── event-mapper.ts                    # Mapeamento puro de transações e métricas (+ .spec.ts)
│   │   │   ├── event.processor.ts                 # Worker Bull da fila 'events'
│   │   │   └── metric.processor.ts                # Workers horários (métricas) e diários (prune)
│   │   ├── services/
│   │   │   ├── dashboard-analytics.service.ts     # KPIs, tendência real, heartbeat e timeline
│   │   │   ├── economy-metrics.service.ts         # Snapshot monetário e overview 7 dias em SQL
│   │   │   ├── heatmap-analytics.service.ts       # Agregação espacial SQL com limite de 2000 células
│   │   │   ├── resource-fines-analytics.service.ts # Telemetria de lojas, corridas e multas
│   │   │   └── risk-scoring.service.ts            # Cálculo normalizado de risco 0.0–1.0 (+ .spec.ts)
│   │   ├── analytics.controller.ts                # Rotas /api/analytics/*
│   │   ├── analytics.gateway.ts                   # Gateway Socket.IO /analytics autenticado
│   │   ├── analytics.module.ts                    # Módulo Analytics e registro de filas Bull
│   │   └── analytics.service.ts                   # Fachada e agendamento cron no onModuleInit
│   ├── auth/
│   │   ├── dto/auth.dto.ts                        # LoginDto e RegisterDto
│   │   ├── strategies/jwt.strategy.ts             # Validação de Bearer JWT e revogação
│   │   ├── auth.controller.ts                     # /api/auth/{login,register,logout,me}
│   │   ├── auth.module.ts                         # Módulo Auth
│   │   └── auth.service.ts                        # Hash bcrypt, sessões, RBAC e denylist Redis
│   ├── common/
│   │   ├── config/env.validation.ts               # Verificação obrigatória de env vars no bootstrap
│   │   ├── decorators/                            # @RateLimit e @Roles
│   │   └── guards/                                # ApiKeyGuard (+ .spec.ts), JwtAuthGuard, RateLimitGuard, RolesGuard
│   ├── database/
│   │   ├── database.module.ts                     # Módulo global de banco e cache
│   │   ├── prisma.service.ts                      # Lifecycle do PrismaClient
│   │   └── redis.service.ts                       # Cliente ioredis e suporte a pipeline
│   ├── economy/
│   │   ├── dto/economy-query.dto.ts               # Whitelist de métricas e períodos permitidos
│   │   ├── economy.controller.ts                  # /api/economy/* (+ .spec.ts)
│   │   ├── economy.module.ts                      # Módulo Economy
│   │   └── economy.service.ts                     # Séries temporais e listagem normalizada de transações
│   ├── mta/
│   │   ├── dto/                                   # BatchEventsDto, HeartbeatDto e PlayerEventDto
│   │   ├── mta.controller.ts                      # Endpoints /api/mta/* protegidos por ApiKeyGuard
│   │   ├── mta.module.ts                          # Módulo MTA
│   │   └── mta.service.ts                         # Enfileiramento Bull com retry e pipeline Redis
│   ├── players/
│   │   ├── players.controller.ts                  # /api/players/{online,search,:id,:id/stats}
│   │   ├── players.module.ts                      # Módulo Players
│   │   └── players.service.ts                     # Queries com saldo completo, busca e NotFoundException
│   ├── app.module.ts                              # Módulo raiz NestJS
│   └── main.ts                                    # Entry point HTTP
├── .env.example                                   # Variáveis de ambiente exemplo
├── docker-compose.yml                             # PostgreSQL 16 + Redis 7
├── nest-cli.json                                  # Configuração CLI NestJS
├── package.json                                   # Dependências e scripts
├── tsconfig.json                                  # TypeScript com strictNullChecks habilitado
└── README.md                                      # Documentação do backend
```

---

## 🚀 Instalação e Scripts

### Subir banco de dados e cache

```bash
cd backend
docker-compose up -d
```

### Rodar em desenvolvimento

```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

### Scripts disponíveis ([`package.json`](package.json))

```bash
npm run start:dev       # Dev server com watch
npm run type-check      # Checagem estrita (tsc --noEmit)
npm run build           # Compilação TypeScript para dist/
npm run test            # Testes unitários nativos (node --test "dist/**/*.spec.js")
npm run start:prod      # Execução em produção (node dist/main)
npm run prisma:generate # Regera o Prisma Client
npm run prisma:migrate  # Cria/aplica migrações em desenvolvimento
npm run prisma:studio   # Interface visual Prisma Studio
```

---

Desenvolvido por **Gabriel Feijó**.
