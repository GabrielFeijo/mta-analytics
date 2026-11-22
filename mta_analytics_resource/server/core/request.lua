MtaAnalyticsRequest = {}

local STATE_CLOSED = "CLOSED"
local STATE_OPEN = "OPEN"
local STATE_HALF_OPEN = "HALF_OPEN"

local circuitState = STATE_CLOSED
local consecutiveFailures = 0
local tripCount = 0
local circuitOpenedAt = 0
local inFlightRequests = 0

local function getCurrentCooldownMs()
    local baseCooldown = Config.CircuitBreaker.cooldownMs or 30000
    local maxCooldown = Config.CircuitBreaker.maxCooldownMs or 300000
    local exponent = math.max(0, tripCount - 1)
    return math.min(baseCooldown * (2 ^ exponent), maxCooldown)
end

local function refreshCircuitState()
    if circuitState ~= STATE_OPEN then
        return
    end
    local elapsed = getTickCount() - circuitOpenedAt
    if elapsed >= getCurrentCooldownMs() then
        circuitState = STATE_HALF_OPEN
        MtaAnalyticsUtils.debugLog("Circuit breaker em HALF_OPEN; aguardando sonda de reconexão.")
    end
end

function MtaAnalyticsRequest.isCircuitOpen()
    refreshCircuitState()
    return circuitState == STATE_OPEN
end

function MtaAnalyticsRequest.canDispatch(forceFlush)
    if forceFlush then
        return true
    end
    if inFlightRequests > 0 then
        return false
    end
    refreshCircuitState()
    return circuitState ~= STATE_OPEN
end

function MtaAnalyticsRequest.getStatus()
    refreshCircuitState()
    return {
        state = circuitState,
        consecutiveFailures = consecutiveFailures,
        tripCount = tripCount,
        inFlight = inFlightRequests,
    }
end

local function buildRequestOptions(payloadTable)
    local timestamp = tostring(MtaAnalyticsUtils.nowMs())
    local body = MtaAnalyticsUtils.encodeJsonObject(payloadTable)
    local hmacSignature = MtaAnalyticsCrypto.signRequest(timestamp, body, Config.API.secret)

    return {
        method = "POST",
        connectionAttempts = 1,
        connectTimeout = Config.API.timeoutMs or 7000,
        headers = {
            ["Content-Type"] = "application/json",
            ["x-api-key"] = Config.API.key,
            ["x-timestamp"] = timestamp,
            ["x-hmac-signature"] = hmacSignature,
        },
        postData = body,
    }
end

local function isRecoverableFailure(responseInfo)
    if not responseInfo or not responseInfo.success then
        return true
    end
    local statusCode = tonumber(responseInfo.statusCode) or 0
    return statusCode == 0 or statusCode == 429 or statusCode >= 500
end

local function handleApiOutcome(isSuccess, recoverable, operationName, statusCode)
    if isSuccess then
        if consecutiveFailures > 0 or circuitState ~= STATE_CLOSED then
            MtaAnalyticsUtils.debugLog("Conexão com a API restaurada após " .. tostring(consecutiveFailures) .. " falhas.")
        end
        consecutiveFailures = 0
        tripCount = 0
        circuitOpenedAt = 0
        circuitState = STATE_CLOSED
        return
    end

    if not recoverable then
        MtaAnalyticsUtils.debugLog(
            "Erro de payload/autenticação em " .. tostring(operationName) .. " (HTTP " .. tostring(statusCode or 0) .. "). Lote descartado."
        )
        return
    end

    consecutiveFailures = consecutiveFailures + 1
    local maxFailures = Config.CircuitBreaker.maxConsecutiveFailures or 5
    MtaAnalyticsUtils.debugLog(
        "Falha recuperável em " .. tostring(operationName) .. " (HTTP " .. tostring(statusCode or 0) .. ") [" .. tostring(consecutiveFailures) .. "/" .. tostring(maxFailures) .. "]"
    )

    if circuitState == STATE_HALF_OPEN or consecutiveFailures >= maxFailures then
        circuitState = STATE_OPEN
        circuitOpenedAt = getTickCount()
        tripCount = tripCount + 1
        MtaAnalyticsUtils.debugLog(
            "Circuit breaker OPEN por " .. tostring(getCurrentCooldownMs()) .. "ms (ciclo #" .. tostring(tripCount) .. ")."
        )
    end
end

function MtaAnalyticsRequest.sendEvent(event)
    if type(event) ~= "table" then
        return
    end
    if not MtaAnalyticsRequest.canDispatch(false) then
        MtaAnalyticsQueue.add(event)
        return
    end

    inFlightRequests = inFlightRequests + 1
    local options = buildRequestOptions(event)
    fetchRemote(Config.API.url .. "/event", options, function(_, responseInfo)
        inFlightRequests = math.max(0, inFlightRequests - 1)
        local statusCode = responseInfo and tonumber(responseInfo.statusCode) or 0
        local ok = responseInfo and responseInfo.success and statusCode >= 200 and statusCode < 400
        local recoverable = isRecoverableFailure(responseInfo)

        handleApiOutcome(ok, recoverable, "sendEvent", statusCode)
        if not ok then
            if recoverable then
                MtaAnalyticsQueue.requeueBatch({ event })
            else
                MtaAnalyticsQueue.recordDropped(1)
            end
        end
    end)
end

function MtaAnalyticsRequest.sendBatch(events)
    if type(events) ~= "table" or #events == 0 then
        return
    end

    inFlightRequests = inFlightRequests + 1
    local options = buildRequestOptions({ events = events })
    fetchRemote(Config.API.url .. "/events/batch", options, function(_, responseInfo)
        inFlightRequests = math.max(0, inFlightRequests - 1)
        local statusCode = responseInfo and tonumber(responseInfo.statusCode) or 0
        local ok = responseInfo and responseInfo.success and statusCode >= 200 and statusCode < 400
        local recoverable = isRecoverableFailure(responseInfo)

        handleApiOutcome(ok, recoverable, "sendBatch", statusCode)
        if ok then
            MtaAnalyticsUtils.debugLog("Lote enviado com sucesso (" .. tostring(#events) .. " eventos).")
            if MtaAnalyticsQueue and #MtaAnalyticsQueue.events >= (Config.Queue.batchSize or 15) then
                MtaAnalyticsQueue.flush(false)
            end
            return
        end

        if recoverable then
            MtaAnalyticsQueue.requeueBatch(events)
        else
            MtaAnalyticsQueue.recordDropped(#events)
        end
    end)
end

function MtaAnalyticsRequest.sendHeartbeat()
    refreshCircuitState()
    if circuitState == STATE_OPEN then
        return
    end

    local payload = {
        playerCount = getPlayerCount(),
        maxPlayers = getMaxPlayers(),
        serverName = getServerName(),
        timestamp = MtaAnalyticsUtils.nowMs(),
        queueSize = MtaAnalyticsQueue and #MtaAnalyticsQueue.events or 0,
    }

    local options = buildRequestOptions(payload)
    fetchRemote(Config.API.url .. "/heartbeat", options, function(_, responseInfo)
        local statusCode = responseInfo and tonumber(responseInfo.statusCode) or 0
        local ok = responseInfo and responseInfo.success and statusCode >= 200 and statusCode < 400
        local recoverable = isRecoverableFailure(responseInfo)

        handleApiOutcome(ok, recoverable, "sendHeartbeat", statusCode)
        if ok and MtaAnalyticsQueue and #MtaAnalyticsQueue.events > 0 then
            MtaAnalyticsQueue.flush(false)
        end
    end)
end
