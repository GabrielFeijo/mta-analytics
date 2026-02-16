Request = {}

local consecutiveFailures = 0

local function handleApiResponse(success, callName)
    if success then
        if consecutiveFailures > 0 then
            if Config.DEBUG then
                outputDebugString("[Analytics] API connection restored. Resetting failure counter.")
            end
            consecutiveFailures = 0
        end
    else
        consecutiveFailures = consecutiveFailures + 1
        outputDebugString("[Analytics] API Call Failed (" .. callName .. "). Consecutive failures: " .. consecutiveFailures .. "/" .. Config.MAX_API_FAILURES)
        
        if consecutiveFailures >= Config.MAX_API_FAILURES then
            outputDebugString("[Analytics] ERROR: Reached maximum consecutive failures (" .. Config.MAX_API_FAILURES .. "). Stopping resource to prevent network spam.")
            stopResource(getThisResource())
        end
    end
end

function Request.sendEvent(event)
    local timestamp = getRealTime().timestamp * 1000
    local body = toJSON(event, true)
    local signature = Crypto.createSignature(Config.API_KEY, tostring(timestamp))
    
    local options = {
        method = "POST",
        headers = {
            ["Content-Type"] = "application/json",
            ["x-api-key"] = Config.API_KEY,
            ["x-timestamp"] = tostring(timestamp),
            ["x-signature"] = signature
        },
        postData = string.sub(body, 2, -2)
    }
    
    fetchRemote(Config.API_URL .. "/event", options, function(responseData, responseInfo )
        handleApiResponse(responseInfo.success, "sendEvent")
        if responseInfo.success then
            if Config.DEBUG then
                outputDebugString("[Analytics] Event sent successfully")
            end
        else
            outputDebugString("[Analytics] Error sending event: " .. tostring(responseInfo ))
        end
    end)
end

function Request.sendBatch(events)
    local timestamp = getRealTime().timestamp * 1000
    local body = toJSON({ events = events }, true)
    
    local signature = Crypto.createSignature(Config.API_KEY, tostring(timestamp))
    local options = {
        method = "POST",
        headers = {
            ["Content-Type"] = "application/json",
            ["x-api-key"] = Config.API_KEY,
            ["x-timestamp"] = tostring(timestamp),
            ["x-signature"] = signature
        },
        postData = string.sub(body, 2, -2)
    }

    fetchRemote(Config.API_URL .. "/events/batch", options, function(responseData, responseInfo )
        handleApiResponse(responseInfo.success, "sendBatch")
        if responseInfo.success then
            if Config.DEBUG then
                outputDebugString("[Analytics] Batch sent successfully (" .. #events .. " events)")
            end
        else
            outputDebugString("[Analytics] Error sending batch: " .. tostring(responseInfo ))
        end
    end)
end

function Request.sendHeartbeat()
    local timestamp = getRealTime().timestamp * 1000
    local data = {
        playerCount = getPlayerCount(),
        maxPlayers = getMaxPlayers(),
        serverName = getServerName(),
        timestamp = timestamp
    }
    local body = toJSON(data, true)
    local signature = Crypto.createSignature(Config.API_KEY, tostring(timestamp))
    
    local options = {
        method = "POST",
        headers = {
            ["Content-Type"] = "application/json",
            ["x-api-key"] = Config.API_KEY,
            ["x-timestamp"] = tostring(timestamp),
            ["x-signature"] = signature
        },
        postData = string.sub(body, 2, -2)
    }


    fetchRemote(Config.API_URL .. "/heartbeat", options, function(responseData, responseInfo )
        handleApiResponse(responseInfo.success, "sendHeartbeat")
        if responseInfo.success then
            if Config.DEBUG then
                outputDebugString("[Analytics] Heartbeat sent")
            end
        else
            outputDebugString("[Analytics] Error sending heartbeat: " .. tostring(responseInfo ))
        end
    end)
end

if Config.DEBUG then
    outputDebugString("[Analytics] Request module loaded")
end
