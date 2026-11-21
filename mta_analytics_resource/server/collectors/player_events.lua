addEventHandler("onPlayerJoin", root, function()
    if not Config.Collectors.PLAYER_JOIN then
        return
    end
    local event = MtaAnalyticsUtils.buildPlayerEvent("player_join", source, {
        ip = getPlayerIP(source),
    })
    MtaAnalyticsQueue.add(event)
end)

addEventHandler("onPlayerQuit", root, function(quitType, reason)
    if not Config.Collectors.PLAYER_QUIT then
        return
    end
    local snapshot = MtaAnalyticsUtils.buildPlayerSnapshot(source)
    snapshot.quitType = tostring(quitType or "Unknown")
    snapshot.reason = reason and tostring(reason) or nil
    local event = MtaAnalyticsUtils.buildPlayerEvent("player_quit", source, snapshot)
    MtaAnalyticsQueue.add(event)
end)

addEventHandler("onPlayerSpawn", root, function()
    if not Config.Collectors.PLAYER_SPAWN then
        return
    end
    local event = MtaAnalyticsUtils.buildPlayerEvent("player_spawn", source, {})
    MtaAnalyticsQueue.add(event)
end)

addEventHandler("onPlayerWasted", root, function(_, killer, killerWeapon, bodypart)
    if not Config.Collectors.PLAYER_WASTED then
        return
    end
    local killerName = "Ambiente"
    local killerSerial = nil
    if MtaAnalyticsUtils.isValidPlayer(killer) then
        killerName = MtaAnalyticsUtils.stripHex(getPlayerName(killer))
        killerSerial = getPlayerSerial(killer)
    end

    local event = MtaAnalyticsUtils.buildPlayerEvent("player_wasted", source, {
        killer = killerName,
        killerSerial = killerSerial,
        weapon = killerWeapon,
        bodypart = bodypart,
    })
    MtaAnalyticsQueue.add(event)
end)

addEventHandler("onPlayerChat", root, function(message, messageType)
    if not Config.Collectors.PLAYER_CHAT then
        return
    end
    local event = MtaAnalyticsUtils.buildPlayerEvent("player_chat", source, {
        message = tostring(message or ""),
        messageType = tonumber(messageType) or 0,
    })
    MtaAnalyticsQueue.add(event)
end)
