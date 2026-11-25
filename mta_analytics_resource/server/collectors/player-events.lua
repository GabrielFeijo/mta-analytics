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
    if MtaAnalyticsCombat and MtaAnalyticsCombat.flushForPlayer then
        MtaAnalyticsCombat.flushForPlayer(source)
    end
    if not Config.Collectors.PLAYER_QUIT then
        return
    end

    local quitData = MtaAnalyticsUtils.hasLoadedCharacter(source)
        and MtaAnalyticsUtils.buildPlayerSnapshot(source)
        or {}
    quitData.quitType = tostring(quitType or "Unknown")
    quitData.reason = reason and tostring(reason) or nil
    local event = MtaAnalyticsUtils.buildPlayerEvent("player_quit", source, quitData)
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
    if MtaAnalyticsCombat and MtaAnalyticsCombat.flushForPlayer then
        MtaAnalyticsCombat.flushForPlayer(source)
    end
    if not Config.Collectors.PLAYER_WASTED then
        return
    end

    local killerName = "Ambiente"
    local killerSerial = nil
    local killerPlayer = MtaAnalyticsUtils.resolvePlayerFromAttacker(killer)
    if killerPlayer then
        killerName = MtaAnalyticsUtils.stripHex(getPlayerName(killerPlayer))
        killerSerial = getPlayerSerial(killerPlayer)
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
