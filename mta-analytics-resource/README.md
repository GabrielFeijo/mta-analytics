# 📡 MTA Analytics Resource - Event Collector para MTA Servers

> Resource Lua para coleta automática de eventos, telemetria e inteligência para servidores de roleplay MTA

[![Lua](https://img.shields.io/badge/Lua-5.1-blue)](http://www.lua.org/)
[![MTA](https://img.shields.io/badge/MTA-1.5.9+-red)](https://docs.multitheftauto.com/)

## 📋 Sobre

O **MTA Analytics Resource** é um resource Lua que roda no servidor MTA e coleta automaticamente:

- **Eventos de Jogador**: Join, quit, movimento, spawn
- **Transações Econômicas**: Dinheiro, transferências, admin adds
- **Eventos de Combate**: Hits, kills, deaths
- **Telemetria**: Posição, direção, velocidade dos jogadores
- **Heartbeat**: Status do resource para o backend

Todos os dados são enviados em batch para o backend em tempo real, permitindo análises e monitoramento completo.

---

## 🚀 Instalação

### 1. Copiar para seu MTA Server

```bash
# Copiar pasta do resource
cp -r mta-analytics-resource /caminho/para/mta-server/resources/
```

### 2. Configurar config.lua

Edite `server/config.lua`:

```lua
Config = {
    --  Backend Connection
    API_URL = "http://localhost:3000/api",      -- URL do backend
    API_KEY = "chave-api-segura",               -- API Key do backend
    
    --  Batch Processing
    BATCH_SIZE = 50,                             -- Eventos por batch
    BATCH_INTERVAL = 5000,                       -- Intervalo em ms (5 segundos)
    
    --  Position Tracking
    POSITION_TRACK_INTERVAL = 5000,              -- Rastrear posição a cada 5s
    POSITION_TRACK_ENABLED = true,               -- Enable/disable
    
    -- Debug Mode
    DEBUG = false                                -- Log detalhado no console
}
```

### 4. Iniciar MTA Server

```bash
# No console do MTA
/start mta-analytics-resource
```

Você deve ver algo como:
```
===========================================
[Analytics] Starting MTA Analytics System
[Analytics] API URL: http://localhost:3000/api
[Analytics] Batch Size: 50
[Analytics] System started successfully
===========================================
```

---

### Processamento

- **Local Queue**: Enfileira eventos localmente
- **Batch Sending**: Agrupa em batches de até 50
- **Retry Logic**: Tenta novamente se falhar
- **Heartbeat**: Ping regular ao backend

---

## 🔌 Usar em Seus Resources

### Exportando Eventos

```lua
-- Em outro resource
local eventId = exports['mta-analytics']:logEvent(
    player,                        -- Player element
    "custom_event",               -- Tipo de evento
    {                             -- Dados customizados
        customField = "valor",
        amount = 100
    }
)
```

### Logging de Transações

```lua
-- Jogador comprou algo na loja
exports['mta-analytics']:logTransaction(
    player,                        -- Player
    "purchase",                   -- Tipo
    1500.00,                      -- Quantidade
    "NPC_STORE",                  -- Fonte
    { itemId = 5, itemName = "AK47" }  -- Metadata
)
```

### Logging Manual de Eventos

```lua
-- Evento completamente customizado
exports['mta-analytics']:logEvent(
    player,
    "faction_mission_completed",
    {
        missionId = 1,
        reward = 5000,
        difficulty = "hard"
    }
)
```

---

## 📊 Estrutura dos Eventos

### Player Event

```lua
PlayerEvent = {
    eventType = "player_join",          -- Tipo do evento
    playerId = 123,                     -- ID do player no MTA
    playerSerial = "AABB11CC22DD",      -- Serial único
    playerUsername = "Player",           -- Username
    
    -- Posição (pode ser nil)
    position = {
        x = 1234.5,
        y = 567.8,
        z = 10.0
    },
    
    -- Dados customizados
    data = {
        dimension = 0,
        interior = 0,
        team = "Police"
    },
    
    timestamp = 1708052000000            -- Unix timestamp em ms
}
```

### Economy Event

```lua
TransactionEvent = {
    eventType = "player_transaction",
    playerId = 123,
    playerSerial = "AABB11CC22DD",
    
    type = "EARN",                      -- EARN|SPEND|TRANSFER
    amount = 5000,
    balance = 50000,
    source = "NPC_STORE",              -- Origem
    
    data = {
        itemId = 5,
        itemName = "AK47"
    },
    
    timestamp = 1708052000000
}
```