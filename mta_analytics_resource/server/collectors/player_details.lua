MtaAnalyticsPlayerDetails = {}

function MtaAnalyticsPlayerDetails.syncAll()
    if not Config.Collectors.PLAYER_STATUS_SYNC then
        return
    end

    local charKey = Config.ElementDataKeys.charId
    for _, player in ipairs(getElementsByType("player")) do
        if MtaAnalyticsUtils.safeElementData(player, charKey, nil) then
            local snapshot = MtaAnalyticsUtils.buildPlayerSnapshot(player)
            local event = MtaAnalyticsUtils.buildPlayerEvent("player_status_sync", player, snapshot)
            MtaAnalyticsQueue.add(event)
        end
    end
end

addEventHandler("onPlayerLogin", root, function()
    local loggedPlayer = source
    setTimer(function()
        if MtaAnalyticsUtils.isValidPlayer(loggedPlayer) then
            local snapshot = MtaAnalyticsUtils.buildPlayerSnapshot(loggedPlayer)
            local event = MtaAnalyticsUtils.buildPlayerEvent("initial_player_sync", loggedPlayer, snapshot)
            MtaAnalyticsQueue.add(event)
        end
    end, 5000, 1)
end)

syncPlayerDetails = MtaAnalyticsPlayerDetails.syncAll
