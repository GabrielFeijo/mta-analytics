MtaAnalyticsUtils = {}

local lastNowMs = 0

function MtaAnalyticsUtils.isFiniteNumber(value)
    return type(value) == "number" and value == value and value ~= math.huge and value ~= -math.huge
end

function MtaAnalyticsUtils.formatTimestamp(ms)
    local numeric = tonumber(ms) or 0
    if not MtaAnalyticsUtils.isFiniteNumber(numeric) or numeric < 0 then
        numeric = 0
    end
    return string.format("%.0f", numeric)
end

function MtaAnalyticsUtils.stripHex(text)
    if type(text) ~= "string" then
        return ""
    end
    return text:gsub("#%x%x%x%x%x%x", "")
end

function MtaAnalyticsUtils.encodeJsonObject(payload)
    if type(payload) ~= "table" or next(payload) == nil then
        return "{}"
    end
    local serialized = toJSON(payload, true)
    if type(serialized) ~= "string" or serialized == "" then
        return "{}"
    end
    if serialized:sub(1, 1) == "[" and serialized:sub(-1) == "]" then
        local unwrapped = serialized:sub(2, -2)
        if unwrapped == "" or unwrapped == "[]" then
            return "{}"
        end
        return unwrapped
    end
    return serialized
end

function MtaAnalyticsUtils.nowMs()
    local rt = getRealTime()
    local subMs = type(getTickCount) == "function" and (getTickCount() % 1000) or 0
    local ms = (rt and rt.timestamp or 0) * 1000 + subMs
    if ms <= lastNowMs then
        ms = lastNowMs + 1
    end
    lastNowMs = ms
    return ms
end

function MtaAnalyticsUtils.isValidPlayer(player)
    return player ~= nil and isElement(player) and getElementType(player) == "player"
end

function MtaAnalyticsUtils.resolvePlayerFromAttacker(attacker)
    if MtaAnalyticsUtils.isValidPlayer(attacker) then
        return attacker
    end
    if attacker ~= nil and isElement(attacker) and getElementType(attacker) == "vehicle" then
        local driver = getVehicleController(attacker)
        if MtaAnalyticsUtils.isValidPlayer(driver) then
            return driver
        end
    end
    return nil
end

function MtaAnalyticsUtils.hasLoadedCharacter(player)
    return MtaAnalyticsUtils.safeElementData(player, Config.ElementDataKeys.charId, nil) ~= nil
end

function MtaAnalyticsUtils.safeElementData(element, key, fallback)
    if not isElement(element) or type(key) ~= "string" then
        return fallback
    end
    local val = getElementData(element, key)
    if val == nil or val == false then
        return fallback
    end
    return val
end

function MtaAnalyticsUtils.roundCoord(value)
    local num = tonumber(value) or 0
    return math.floor(num * 100 + 0.5) / 100
end

function MtaAnalyticsUtils.buildPlayerSnapshot(player)
    local keys = Config.ElementDataKeys
    return {
        money = tonumber(MtaAnalyticsUtils.safeElementData(player, keys.money, getPlayerMoney(player) or 0)) or 0,
        bank = tonumber(MtaAnalyticsUtils.safeElementData(player, keys.bank, 0)) or 0,
        dirtyMoney = tonumber(MtaAnalyticsUtils.safeElementData(player, keys.dirtyMoney, 0)) or 0,
        level = tonumber(MtaAnalyticsUtils.safeElementData(player, keys.level, 1)) or 1,
        xp = tonumber(MtaAnalyticsUtils.safeElementData(player, keys.xp, 0)) or 0,
        job = tostring(MtaAnalyticsUtils.safeElementData(player, keys.job, "Desempregado")),
        playedTime = tonumber(MtaAnalyticsUtils.safeElementData(player, keys.playedTime, 0)) or 0,
        id = tonumber(MtaAnalyticsUtils.safeElementData(player, keys.charId, nil)),
        thirst = tonumber(MtaAnalyticsUtils.safeElementData(player, keys.thirst, 100)) or 100,
        hunger = tonumber(MtaAnalyticsUtils.safeElementData(player, keys.hunger, 100)) or 100,
        pp = tonumber(MtaAnalyticsUtils.safeElementData(player, keys.premiumPoints, 0)) or 0,
        faction = MtaAnalyticsUtils.safeElementData(player, keys.faction, nil),
    }
end

function MtaAnalyticsUtils.buildPlayerEvent(eventType, player, data)
    if not MtaAnalyticsUtils.isValidPlayer(player) then
        return nil
    end

    local x, y, z = getElementPosition(player)
    local rawName = getPlayerName(player) or "Unknown"
    local cleanName = MtaAnalyticsUtils.stripHex(rawName)
    local charId = tonumber(MtaAnalyticsUtils.safeElementData(player, Config.ElementDataKeys.charId, nil))

    local payloadData = {}
    if type(data) == "table" then
        for k, v in pairs(data) do
            payloadData[k] = v
        end
    end
    if type(payloadData.message) == "string" and #payloadData.message > 500 then
        payloadData.message = string.sub(payloadData.message, 1, 500)
    end
    if charId and payloadData.id == nil then
        payloadData.id = charId
    end
    -- Garante ao menos uma chave para que toJSON não serialize tabela vazia como []
    if next(payloadData) == nil then
        payloadData.source = "mta"
    end

    return {
        eventType = tostring(eventType),
        playerSerial = getPlayerSerial(player) or "UNKNOWN_SERIAL",
        playerName = cleanName ~= "" and cleanName or rawName,
        position = {
            x = MtaAnalyticsUtils.roundCoord(x),
            y = MtaAnalyticsUtils.roundCoord(y),
            z = MtaAnalyticsUtils.roundCoord(z),
        },
        data = payloadData,
        timestamp = MtaAnalyticsUtils.nowMs(),
    }
end

function MtaAnalyticsUtils.debugLog(message)
    if Config.Debug then
        outputDebugString("[mta_analytics_resource] " .. tostring(message), 3)
    end
end
