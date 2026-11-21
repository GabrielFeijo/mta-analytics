MtaAnalyticsCombat = {}

local pendingDamage = {}

local function flushDamageEntry(key)
    local entry = pendingDamage[key]
    if not entry then
        return
    end
    pendingDamage[key] = nil

    if entry.timer and isTimer(entry.timer) then
        killTimer(entry.timer)
    end

    if not MtaAnalyticsUtils.isValidPlayer(entry.victim) then
        return
    end

    local event = MtaAnalyticsUtils.buildPlayerEvent("player_damage", entry.victim, {
        attacker = entry.attackerName,
        attackerSerial = entry.attackerSerial,
        weapon = entry.weapon,
        bodypart = entry.bodypart,
        damage = MtaAnalyticsUtils.roundCoord(entry.damage),
        hits = entry.hits,
    })
    MtaAnalyticsQueue.add(event)
end

function MtaAnalyticsCombat.flushForPlayer(player)
    local keysToFlush = {}
    for key, entry in pairs(pendingDamage) do
        if entry.victim == player then
            table.insert(keysToFlush, key)
        end
    end
    for _, key in ipairs(keysToFlush) do
        flushDamageEntry(key)
    end
end

function MtaAnalyticsCombat.flushAll()
    local keysToFlush = {}
    for key in pairs(pendingDamage) do
        table.insert(keysToFlush, key)
    end
    for _, key in ipairs(keysToFlush) do
        flushDamageEntry(key)
    end
end

addEventHandler("onPlayerDamage", root, function(attacker, weapon, bodypart, loss)
    if not Config.Collectors.PLAYER_DAMAGE or not MtaAnalyticsUtils.isValidPlayer(source) then
        return
    end

    local attackerName = "Ambiente"
    local attackerSerial = nil
    if MtaAnalyticsUtils.isValidPlayer(attacker) then
        attackerName = MtaAnalyticsUtils.stripHex(getPlayerName(attacker))
        attackerSerial = getPlayerSerial(attacker)
    end

    local victimSerial = getPlayerSerial(source) or tostring(source)
    local key = victimSerial .. "|" .. tostring(attackerSerial or "env") .. "|" .. tostring(weapon or 0)
    local existing = pendingDamage[key]

    if existing then
        existing.damage = existing.damage + (tonumber(loss) or 0)
        existing.hits = existing.hits + 1
        existing.bodypart = bodypart
        return
    end

    local aggregateMs = Config.Intervals.damageAggregateMs or 1500
    pendingDamage[key] = {
        victim = source,
        attackerName = attackerName,
        attackerSerial = attackerSerial,
        weapon = weapon,
        bodypart = bodypart,
        damage = tonumber(loss) or 0,
        hits = 1,
        timer = setTimer(flushDamageEntry, aggregateMs, 1, key),
    }
end)

addEventHandler("onPlayerVehicleEnter", root, function(vehicle, seat)
    if not Config.Collectors.VEHICLE_ENTER or not isElement(vehicle) then
        return
    end
    local model = getElementModel(vehicle)
    local event = MtaAnalyticsUtils.buildPlayerEvent("vehicle_enter", source, {
        vehicleModel = model,
        vehicleName = getVehicleNameFromModel(model) or "Unknown",
        seat = tonumber(seat) or 0,
    })
    MtaAnalyticsQueue.add(event)
end)

addEventHandler("onPlayerVehicleExit", root, function(vehicle, seat)
    if not Config.Collectors.VEHICLE_EXIT or not isElement(vehicle) then
        return
    end
    local model = getElementModel(vehicle)
    local event = MtaAnalyticsUtils.buildPlayerEvent("vehicle_exit", source, {
        vehicleModel = model,
        vehicleName = getVehicleNameFromModel(model) or "Unknown",
        seat = tonumber(seat) or 0,
    })
    MtaAnalyticsQueue.add(event)
end)
