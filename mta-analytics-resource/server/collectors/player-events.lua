function createPlayerEvent(eventType, player, data)
    local x, y, z = getElementPosition(player)
    
    return {
        eventType = eventType,
        playerSerial = getPlayerSerial(player),
        playerName = getPlayerName(player),
        position = {
            x = x,
            y = y,
            z = z
        },
        data = data or {},
        timestamp = getRealTime().timestamp * 1000
    }
end

addEventHandler("onPlayerJoin", root, function()
    if not Config.COLLECT_EVENTS.PLAYER_JOIN then return end
    
    local event = createPlayerEvent("player_join", source, {
        ip = getPlayerIP(source)
    })
    
    EventQueue.add(event)
end)

addEventHandler("onPlayerQuit", root, function(quitType, reason)
    if not Config.COLLECT_EVENTS.PLAYER_QUIT then return end
    
    local event = createPlayerEvent("player_quit", source, {
        quitType = quitType,
        reason = reason
    })
    
    EventQueue.add(event)
end)

addEventHandler("onPlayerSpawn", root, function()
    if not Config.COLLECT_EVENTS.PLAYER_SPAWN then return end
    
    local event = createPlayerEvent("player_spawn", source, {})
    EventQueue.add(event)
end)

addEventHandler("onPlayerWasted", root, function(totalAmmo, killer, killerWeapon, bodypart)
    if not Config.COLLECT_EVENTS.PLAYER_WASTED then return end
    
    local killerName = killer and getPlayerName(killer) or "Unknown"
    local killerSerial = killer and getPlayerSerial(killer) or nil
    
    local event = createPlayerEvent("player_wasted", source, {
        killer = killerName,
        killerSerial = killerSerial,
        weapon = killerWeapon,
        bodypart = bodypart
    })
    
    EventQueue.add(event)
end)

addEventHandler("onPlayerChat", root, function(message, messageType)
    if not Config.COLLECT_EVENTS.PLAYER_CHAT then return end
    
    local event = createPlayerEvent("player_chat", source, {
        message = message,
        messageType = messageType
    })
    
    EventQueue.add(event)
end)

if Config.DEBUG then
    outputDebugString("[Analytics] Player events collector loaded")
end
