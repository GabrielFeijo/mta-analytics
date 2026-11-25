Config = {}

local function readSetting(name, fallback)
    if type(get) ~= "function" then
        return fallback
    end
    local value = get(name)
    if value == nil or value == false or value == "" then
        return fallback
    end
    return value
end

local function readBoolSetting(name, fallback)
    if type(get) ~= "function" then
        return fallback
    end
    local value = get(name)
    if type(value) == "string" then
        if value == "true" then
            return true
        end
        if value == "false" then
            return false
        end
    elseif value == true then
        return true
    end
    return fallback
end

local function loadLocalSecrets()
    if type(fileExists) ~= "function" or not fileExists("server/secrets.json") then
        return {}
    end
    local handle = fileOpen("server/secrets.json", true)
    if not handle then
        return {}
    end
    local size = fileGetSize(handle)
    local raw = size > 0 and fileRead(handle, size) or ""
    fileClose(handle)

    if type(raw) ~= "string" or raw == "" or type(fromJSON) ~= "function" then
        return {}
    end

    local parsed = fromJSON(raw)
    if type(parsed) ~= "table" then
        return {}
    end
    if type(parsed[1]) == "table" and not parsed.apiSecret and not parsed.apiKey then
        parsed = parsed[1]
    end
    return parsed
end

local localSecrets = loadLocalSecrets()

local function readConfigValue(settingName, secretKey, fallback)
    local fromSetting = readSetting(settingName, nil)
    if fromSetting ~= nil then
        return fromSetting
    end
    local fromFile = localSecrets[secretKey]
    if fromFile ~= nil and fromFile ~= false and fromFile ~= "" then
        return fromFile
    end
    return fallback
end

-- Configuração de conexão HTTP com o backend NestJS do MTA Analytics (server-only)
Config.API = {
    url = tostring(readConfigValue("apiUrl", "apiUrl", "http://127.0.0.1:3000/api/mta")), -- Endpoint base da API de ingestão
    key = tostring(readConfigValue("apiKey", "apiKey", "mta-server-key-1")), -- Chave do servidor cadastrada em MTA_API_KEYS
    secret = tostring(readConfigValue("apiSecret", "apiSecret", "your-super-secret-hmac-key-change-this-in-production")), -- Segredo compartilhado em MTA_SECRET
    timeoutMs = 7000, -- Timeout de requisição HTTP em milissegundos
}

-- Configuração de enfileiramento e envio em lotes (Batching)
Config.Queue = {
    batchSize = 15, -- Quantidade de eventos que dispara um flush imediato
    flushIntervalMs = 5000, -- Intervalo periódico de envio da fila (ms)
    maxBufferSize = 500, -- Limite máximo de eventos retidos em memória durante quedas da API
}

-- Intervalos de amostragem periódica e agregação do servidor (ms)
Config.Intervals = {
    heartbeatMs = 60000, -- Pulso de saúde do servidor (/heartbeat)
    positionTrackMs = 30000, -- Amostragem de posição para o Mapa de Calor
    statusSyncMs = 60000, -- Sincronização de saldo, banco, nível, emprego e status vital
    damageAggregateMs = 1500, -- Janela de agregação para rajadas de dano (onPlayerDamage)
}

-- Disjuntor de proteção de rede (Circuit Breaker com backoff exponencial)
Config.CircuitBreaker = {
    maxConsecutiveFailures = 5, -- Falhas seguidas antes de abrir o circuito
    cooldownMs = 30000, -- Cooldown inicial antes do estado HALF_OPEN (ms)
    maxCooldownMs = 300000, -- Teto de backoff exponencial entre tentativas (5 min)
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
    VEHICLE_ENTER = true,
    VEHICLE_EXIT = true,
    PLAYER_STATUS_SYNC = true,
    PLAYER_POSITION = true,
}

-- Logs de diagnóstico no console do servidor (outputDebugString)
Config.Debug = readBoolSetting("debug", false)

if tostring(Config.API.secret):find("change-this", 1, true) then
    outputDebugString(
        "[mta_analytics_resource] AVISO: usando MTA_SECRET padrão. Configure apiSecret no meta.xml/settings.xml.",
        2
    )
end
