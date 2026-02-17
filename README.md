# 📊 MTA Analytics - Dashboard de Inteligência para Servidores

> Plataforma completa de análise e monitoramento em tempo real para servidores MTA (Multi Theft Auto) com WebSocket, queue de eventos e visualizações interativas 3D.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.3-red?logo=nestjs)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-18.2-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0-purple?logo=vite)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-red?logo=redis)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://www.docker.com/)

## 📋 Sobre o Projeto

O **MTA Analytics** é uma plataforma full-stack que fornece inteligência para servidores de roleplay MTA, permitindo monitoramento em tempo real, análise econômica, rastreamento de jogadores e detecção de anomalias. O sistema é composto por um backend, frontend interativo com visualizações 3D e um resource Lua para coleta automática de eventos.

### 🎯 Destaques Técnicos

- **Análise em Tempo Real**: WebSocket bidirecional para updates instantâneos do dashboard
- **Queue de Eventos**: Bull Queue com Redis para processamento assíncrono confiável
- **Visualizações 3D**: Mapas de calor e heatmap com Three.js e D3
- **Multi-camada**: Backend REST + WebSocket, Frontend SPA, Resource integrável
- **Isolamento de Dados**: Suporte para múltiplos servidores MTA
- **API Segura**: Autenticação JWT com guards de API Key para o resource Lua
- **ORM Type-Safe**: Prisma com PostgreSQL para modelagem robusta
- **Docker Ready**: Containerização completa com Docker Compose

---

## 🌐 Demonstração Visual

### Dashboard Principal

![Dashboard Overview](https://i.imgur.com/05EJnf8.png)
_Dashboard central com estatísticas de jogadores, eventos recentes e economia_

### Visualização de Heatmap

![Heatmap View](https://i.imgur.com/CutcBj6.png)
_Mapa de calor 3D mostrando concentração de jogadores e atividades no servidor_

### Sistema de Multas

![Fines Management](https://i.imgur.com/mHOYI5p.png)
_Interface de gerenciamento de multas e penalidades aplicadas_

### Resource Inicialização

![MTA Resource Init](https://i.imgur.com/6tx4l0B.png)
_Console mostrando inicialização bem-sucedida do analytics resource_

---

## 🚀 Início Rápido

### Pré-requisitos

Certifique-se de ter instalado:

- [Docker](https://www.docker.com/get-started) 20.10+
- [Docker Compose](https://docs.docker.com/compose/install/) 2.0+

### 🐳 Instalação com Docker (Recomendado)

1. **Clone o repositório**

   ```bash
   git clone https://github.com/GabrielFeijo/mta-analytics.git
   cd mta-analytics
   ```

2. **Inicie os serviços**

   ```bash
   docker-compose up -d
   ```

3. **Aguarde a inicialização** (primeira vez pode levar 2-3 minutos)

4. **Acesse as aplicações**
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:3000](http://localhost:3000)
   - PostgreSQL: `localhost:5432`
   - Redis: `localhost:6379`

### 📦 Estrutura do Projeto

```
mta-analytics/
├── backend/                        # API NestJS + WebSocket
│   ├── docker-compose.yml
│   ├── nest-cli.json
│   ├── tsconfig.json
│   ├── package.json
│   ├── prisma/                    # Database ORM
│   │   ├── schema.prisma          # Modelo de dados
│   │   ├── migrations/            # Histórico de migrações
│   │   │   ├── 20260215012801_initial_migration/
│   │   │   └── 20260216011204_add_player_detail/
│   │   └── migration_lock.toml
│   └── src/
│       ├── app.module.ts          # Módulo raiz
│       ├── main.ts                # Entry point
│       ├── analytics/             # Processamento de eventos e dashboard
│       │   ├── analytics.controller.ts
│       │   ├── analytics.gateway.ts      # WebSocket gateway
│       │   ├── analytics.service.ts
│       │   ├── analytics.module.ts
│       │   └── processors/
│       │       ├── event.processor.ts
│       │       └── metric.processor.ts
│       ├── auth/                  # Autenticação JWT
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── auth.module.ts
│       │   ├── dto/
│       │   │   └── auth.dto.ts
│       │   └── strategies/
│       │       └── jwt.strategy.ts
│       ├── players/               # Gerenciamento de jogadores
│       │   ├── players.controller.ts
│       │   ├── players.service.ts
│       │   └── players.module.ts
│       ├── economy/               # Análise econômica
│       │   ├── economy.controller.ts
│       │   ├── economy.service.ts
│       │   └── economy.module.ts
│       ├── mta/                   # Endpoints para resource Lua
│       │   ├── mta.controller.ts
│       │   ├── mta.service.ts
│       │   ├── mta.module.ts
│       │   └── dto/
│       │       ├── batch-events.dto.ts
│       │       └── player-event.dto.ts
│       ├── database/              # Database e Cache
│       │   ├── database.module.ts
│       │   ├── prisma.service.ts
│       │   └── redis.service.ts
│       └── common/                # Recursos compartilhados
│           └── guards/
│               ├── api-key.guard.ts
│               └── jwt-auth.guard.ts
│
├── frontend/                       # SPA React + Vite
│   ├── index.html
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── components.json
│   ├── package.json
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── vite-env.d.ts
│       ├── components/            # Componentes React
│       │   ├── dashboard/
│       │   │   ├── HeatmapView.tsx      # Visualização 3D
│       │   │   ├── Overview.tsx         # Snapshot econômico
│       │   │   └── RecentActivity.tsx   # Atividades recentes
│       │   ├── economy/
│       │   │   └── TransactionTable.tsx
│       │   ├── players/
│       │   ├── ui/                # shadcn/ui components
│       │   └── layout/
│       │       └── Layout.tsx
│       ├── pages/                 # Páginas da aplicação
│       │   ├── Dashboard.tsx
│       │   ├── Players.tsx
│       │   ├── Economy.tsx
│       │   ├── Fines.tsx
│       │   ├── Resources.tsx
│       │   ├── Login.tsx
│       │   └── Register.tsx
│       ├── hooks/                 # React Hooks customizados
│       │   └── useAnalyticsSocket.ts
│       ├── lib/                   # Utilitários
│       │   ├── api.ts            # Axios instance
│       │   ├── types.ts          # TypeScript types
│       │   └── utils.ts
│       ├── stores/                # State management (Zustand)
│       │   ├── authStore.ts
│       │   └── dashboardStore.ts
│       └── styles/
│           └── globals.css
│
├── mta-analytics-resource/         # Resource Lua para MTA
│   ├── meta.xml                   # Metadata do resource
│   ├── client/
│   │   ├── main.lua              # Entry point cliente
│   │   └── events/
│   │       └── player.lua         # Eventos de jogador
│   └── server/
│       ├── config.lua             # Configuração
│       ├── main.lua               # Entry point servidor
│       ├── collectors/            # Coleta de eventos
│       │   ├── player-events.lua      # Join, quit, movimento
│       │   ├── player-details.lua     # Detalhes do jogador
│       │   ├── economy-events.lua     # Transações monetárias
│       │   └── combat-events.lua      # Eventos de combate
│       └── core/
│           ├── config.lua         # Constantes
│           ├── crypto.lua         # Criptografia
│           ├── queue.lua          # Enfileiramento local
│           ├── request.lua        # HTTP requests
│           └── exports.lua        # Exports para outros resources
│
└── docker-compose.yml             # Orquestração de serviços
```

---

## 📦 Scripts e Comandos

### Docker Compose

```bash
# Iniciar tudo
docker-compose up -d

# Parar serviços
docker-compose down

# Ver logs
docker-compose logs -f

# Recriar sem cache
docker-compose up -d --build
```

### Backend

```bash
# Desenvolvimento com recarregar automático
npm run start:dev

# Build para produção
npm run build

# Produção
npm run start:prod

# Prisma
npm run prisma:generate   # Gerar Prisma Client
npm run prisma:migrate    # Executar migrations
npm run prisma:studio     # GUI do banco de dados (localhost:5555)
```

### Frontend

```bash
# Dev server
npm run dev

# Build
npm run build

# Preview do build
npm run preview
```
