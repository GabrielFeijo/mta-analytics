MtaAnalyticsRequest = {}

local consecutiveFailures = 0
local circuitOpenedAt = 0

function MtaAnalyticsRequest.isCircuitOpen()
    if circuitOpenedAt == 0 then
        return false
    end
    local elapsed = getTickCount() - circuitOpenedAt
    if elapsed >= (Config.CircuitBreaker.cooldownMs or 30000) then
        return false
    end
    return true
end

local function buildRequestOptions(payloadTable)
    local timestamp = tostring(MtaAnalyticsUtils.nowMs())
    local body = MtaAnalyticsUtils.encodeJsonObject(payloadTable)
    local signature = MtaAnalyticsCrypto.createSignature(Config.API.key, timestamp)
    local hmacSignature = MtaAnalyticsCrypto.createHmacSignature(Config.API.key, timestamp, Config.API.secret)

    return {
        method = "POST",
        connectionAttempts = 1,
        connectTimeout = Config.API.timeoutMs or 7000,
        headers = {
            ["Content-Type"] = "application/json",
            ["x-api-key"] = Config.API.key,
            ["x-timestamp"] = timestamp,
            ["x-signature"] = signature,
            ["x-hmac-signature"] = hmacSignature,
        },
        postData = body,
    }
end

local function handleApiOutcome(isSuccess, operationName, statusCode)
    if isSuccess then
        if consecutiveFailures > 0 or circuitOpenedAt > 0 then
            MtaAnalyticsUtils.debugLog("Conexão com a API restaurada após " .. tostring(consecutiveFailures) .. " falhas.")
        end
        consecutiveFailures = 0
        circuitOpenedAt = 0
        return
    end

    consecutiveFailures = consecutiveFailures + 1
    local maxFailures = Config.CircuitBreaker.maxConsecutiveFailures or 5
    MtaAnalyticsUtils.debugLog(
        "Falha em " .. tostring(operationName) .. " (HTTP " .. tostring(statusCode or 0) .. ") [" .. tostring(consecutiveFailures) .. "/" .. tostring(maxFailures) .. "]"
    )

    if consecutiveFailures >= maxFailures and circuitOpenedAt == 0 then
        circuitOpenedAt = getTickCount()
        MtaAnalyticsUtils.debugLog("Circuit breaker ativado por " .. tostring(Config.CircuitBreaker.cooldownMs) .. "ms. Eventos permanecem retidos no buffer.")
    end
end

function MtaAnalyticsRequest.sendEvent(event)
    if type(event) ~= "table" then
        return
    end
    if MtaAnalyticsRequest.isCircuitOpen() then
        MtaAnalyticsQueue.add(event)
        return
    end

    local options = buildRequestOptions(event)
    fetchRemote(Config.API.url .. "/event", options, function(_, responseInfo)
        local ok = responseInfo and responseInfo.success and (tonumber(responseInfo.statusCode) or 200) < 400
        handleApiOutcome(ok, "sendEvent", responseInfo and responseInfo.statusCode)
        if not ok then
            MtaAnalyticsQueue.requeueBatch({ event })
        end
    end)
end

function MtaAnalyticsRequest.sendBatch(events)
    if type(events) ~= "table" or #events == 0 then
        return
    end

    local options = buildRequestOptions({ events = events })
    fetchRemote(Config.API.url .. "/events/batch", options, function(_, responseInfo)
        local ok = responseInfo and responseInfo.success and (tonumber(responseInfo.statusCode) or 200) < 400
        handleApiOutcome(ok, "sendBatch", responseInfo and responseInfo.statusCode)
        if ok then
            MtaAnalyticsUtils.debugLog("Lote enviado com sucesso (" .. tostring(#events) .. " eventos).")
        else
            MtaAnalyticsQueue.requeueBatch(events)
        end
    end)
end

function MtaAnalyticsRequest.sendHeartbeat()
    local payload = {
        playerCount = getPlayerCount(),
        maxPlayers = getMaxPlayers(),
        serverName = getServerName(),
        timestamp = MtaAnalyticsUtils.nowMs(),
        queueSize = MtaAnalyticsQueue and #MtaAnalyticsQueue.events or 0,
    }

    local options = buildRequestOptions(payload)
    fetchRemote(Config.API.url .. "/heartbeat", options, function(_, responseInfo)
        local ok = responseInfo and responseInfo.success and (tonumber(responseInfo.statusCode) or 200) < 400
        handleApiOutcome(ok, "sendHeartbeat", responseInfo and responseInfo.statusCode)
        if ok and MtaAnalyticsQueue and #MtaAnalyticsQueue.events > 0 then
            MtaAnalyticsQueue.flush(true)
        end
    end)
end

Request = MtaAnalyticsRequest
