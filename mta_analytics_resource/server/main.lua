local heartbeatTimer = nil
local positionTimer = nil
local statusSyncTimer = nil
local bootTimer = nil

local function samplePlayerPositions()
    if not Config.Collectors.PLAYER_POSITION then
        return
    end
    for _, player in ipairs(getElementsByType("player")) do
        local event = MtaAnalyticsUtils.buildPlayerEvent("player_position", player, {
            dimension = getElementDimension(player),
            interior = getElementInterior(player),
            inVehicle = isPedInVehicle(player),
        })
        MtaAnalyticsQueue.add(event)
    end
end

local function safeKillTimer(timerHandle)
    if timerHandle and isTimer(timerHandle) then
        killTimer(timerHandle)
    end
end

addEventHandler("onResourceStart", resourceRoot, function()
    MtaAnalyticsQueue.startTimer()

    heartbeatTimer = setTimer(function()
        MtaAnalyticsRequest.sendHeartbeat()
    end, Config.Intervals.heartbeatMs or 60000, 0)

    positionTimer = setTimer(samplePlayerPositions, Config.Intervals.positionTrackMs or 30000, 0)

    statusSyncTimer = setTimer(function()
        MtaAnalyticsPlayerDetails.syncAll()
    end, Config.Intervals.statusSyncMs or 60000, 0)

    bootTimer = setTimer(function()
        bootTimer = nil
        MtaAnalyticsRequest.sendHeartbeat()
        MtaAnalyticsPlayerDetails.syncAll()
    end, 2500, 1)

    MtaAnalyticsUtils.debugLog("Coletor server-only iniciado -> " .. tostring(Config.API.url))
end)

addEventHandler("onResourceStop", resourceRoot, function()
    safeKillTimer(bootTimer)
    safeKillTimer(heartbeatTimer)
    safeKillTimer(positionTimer)
    safeKillTimer(statusSyncTimer)
    bootTimer = nil
    heartbeatTimer = nil
    positionTimer = nil
    statusSyncTimer = nil

    if MtaAnalyticsCombat and MtaAnalyticsCombat.flushAll then
        MtaAnalyticsCombat.flushAll()
    end

    MtaAnalyticsQueue.stopTimer()
    MtaAnalyticsQueue.flush(true)
end)
