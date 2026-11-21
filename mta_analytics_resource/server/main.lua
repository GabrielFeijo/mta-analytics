local heartbeatTimer = nil
local positionTimer = nil
local statusSyncTimer = nil

local function samplePlayerPositions()
    if not Config.Collectors.PLAYER_POSITION then
        return
    end
    for _, player in ipairs(getElementsByType("player")) do
        local x, y, z = getElementPosition(player)
        local event = MtaAnalyticsUtils.buildPlayerEvent("player_position", player, {
            position = {
                x = MtaAnalyticsUtils.roundCoord(x),
                y = MtaAnalyticsUtils.roundCoord(y),
                z = MtaAnalyticsUtils.roundCoord(z),
            },
            dimension = getElementDimension(player),
            interior = getElementInterior(player),
        })
        MtaAnalyticsQueue.add(event)
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

    setTimer(function()
        MtaAnalyticsRequest.sendHeartbeat()
        MtaAnalyticsPlayerDetails.syncAll()
    end, 2500, 1)

    MtaAnalyticsUtils.debugLog("Coletor iniciado -> " .. tostring(Config.API.url))
end)

addEventHandler("onResourceStop", resourceRoot, function()
    if heartbeatTimer and isTimer(heartbeatTimer) then
        killTimer(heartbeatTimer)
    end
    if positionTimer and isTimer(positionTimer) then
        killTimer(positionTimer)
    end
    if statusSyncTimer and isTimer(statusSyncTimer) then
        killTimer(statusSyncTimer)
    end

    MtaAnalyticsQueue.stopTimer()
    MtaAnalyticsQueue.flush(true)
end)
