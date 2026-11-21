Config = {}

-- Configuração de conexão HTTP com o backend NestJS do MTA Analytics
Config.API = {
    url = "http://127.0.0.1:3000/api/mta", -- Endpoint base da API de ingestão
    key = "mta-server-key-1", -- Chave do servidor cadastrada em MTA_API_KEYS
    secret = "your-super-secret-hmac-key-change-this-in-production", -- Segredo compartilhado em MTA_SECRET
    timeoutMs = 7000, -- Timeout de requisição HTTP em milissegundos
}

-- Configuração de enfileiramento e envio em lotes (Batching)
Config.Queue = {
    batchSize = 15, -- Quantidade de eventos que dispara um flush imediato
    flushIntervalMs = 5000, -- Intervalo periódico de envio da fila (ms)
    maxBufferSize = 500, -- Limite máximo de eventos retidos em memória durante quedas da API
}

-- Intervalos de amostragem periódica do servidor (ms)
Config.Intervals = {
    heartbeatMs = 60000, -- Pulso de saúde do servidor (/heartbeat)
    positionTrackMs = 30000, -- Amostragem de posição para o Mapa de Calor
    statusSyncMs = 60000, -- Sincronização de saldo, banco, nível, emprego e status vital
}

-- Disjuntor de proteção de rede (Circuit Breaker sem derrubar o resource)
Config.CircuitBreaker = {
    maxConsecutiveFailures = 5, -- Falhas seguidas antes de entrar em modo cooldown
    cooldownMs = 30000, -- Tempo de pausa antes de testar reconexão via heartbeat
}

-- Chaves de elementData utilizadas pelo gamemode para leitura de perfil do jogador
Config.ElementDataKeys = {
    charId = "char:id",
    money = "char:money",
    bank = "char:bankmoney",
    dirtyMoney = "char:moneysujo",
    level = "Sys:Level",
    xp = "LSys:EXP",
    job = "job",
    playedTime = "char:playedTime",
    thirst = "char:thirst",
    hunger = "char:hunger",
    premiumPoints = "char:pp",
    faction = "char:dutyfaction",
}

-- Coletores automáticos habilitados
Config.Collectors = {
    PLAYER_JOIN = true,
    PLAYER_QUIT = true,
    PLAYER_SPAWN = true,
    PLAYER_WASTED = true,
    PLAYER_DAMAGE = true,
    PLAYER_CHAT = true,
    MONEY_CHANGE = true,
    VEHICLE_ENTER = true,
    VEHICLE_EXIT = true,
    PLAYER_STATUS_SYNC = true,
    PLAYER_POSITION = true,
}

-- Logs de diagnóstico no console do servidor (outputDebugString)
Config.Debug = false

Config.API_URL = Config.API.url
Config.API_KEY = Config.API.key
Config.API_SECRET = Config.API.secret
Config.BATCH_SIZE = Config.Queue.batchSize
Config.BATCH_INTERVAL = Config.Queue.flushIntervalMs
Config.POSITION_TRACK_INTERVAL = Config.Intervals.positionTrackMs
Config.STATUS_SYNC_INTERVAL = Config.Intervals.statusSyncMs
Config.COLLECT_EVENTS = Config.Collectors
Config.DEBUG = Config.Debug
Config.MAX_API_FAILURES = Config.CircuitBreaker.maxConsecutiveFailures

MtaAnalyticsConfig = Config
