# 🚀 MTA Analytics Backend - API de Análise em Tempo Real

> API REST robusta com WebSocket, Bull Queue e Prisma para análise completa de servidores MTA

[![NestJS](https://img.shields.io/badge/NestJS-10.3-red?logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.8-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-red?logo=redis)](https://redis.io/)
[![Bull](https://img.shields.io/badge/Bull-4.12-yellow)](https://github.com/OptimalBits/bull)

## 📋 Sobre

Este é o backend central do MTA Analytics, fornecendo:

- **API REST RESTful** com validação automática de DTOs
- **WebSocket** em tempo real para atualização de dashboard
- **Bull Queue** com Redis para processamento assíncrono de eventos
- **ORM Prisma** com PostgreSQL para dados estruturados
- **Autenticação JWT** segura com API Key para resource Lua
- **Processamento de Eventos** em background com jobs schedulados

---

## 🌐 Demonstração

### Local

- **API**: [http://localhost:3000](http://localhost:3000)
- **WebSocket**: `ws://localhost:3000/socket.io/`

---

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+
- PostgreSQL 16 (ou Docker)
- Redis 7 (ou Docker)

### Método 1: Docker (Recomendado)

```bash
docker-compose up -d
```

### Método 2: Instalação Manual

1. **Instale dependências**

   ```bash
   cd backend
   npm install
   ```

2. **Configure .env**

   ```bash
   cp .env.example .env
   ```

3. **Configure banco de dados**

   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. **Inicie o servidor**
   ```bash
   npm run start:dev
   ```

---

## 📋 Scripts

```bash
# Desenvolvimento
npm run start:dev           # Dev server com hot reload
npm run build              # Build TypeScript
npm run start:prod         # Produção

# Database
npm run prisma:generate    # Gerar Prisma Client
npm run prisma:migrate     # Criar/executar migrações
npm run prisma:studio      # GUI do banco (localhost:5555)
```
