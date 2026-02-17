function syncPlayerDetails()
    if not Config.COLLECT_EVENTS.PLAYER_STATUS_SYNC then return end
    
    for _, player in ipairs(getElementsByType("player")) do
        if getElementData(player, "char:id") then
            local data = {
                money = getElementData(player, "char:money") or 0,
                bank = getElementData(player, "char:bankmoney") or 0,
                level = getElementData(player, "Sys:Level") or 1,
                xp = getElementData(player, "LSys:EXP") or 0,
                job = getElementData(player, "job") or "Desempregado",
                playedTime = getElementData(player, "char:playedTime") or 0,
                id = getElementData(player, "char:id"),
                thirst = getElementData(player, "char:thirst") or 100,
                hunger = getElementData(player, "char:hunger") or 100,
                pp = getElementData(player, "char:pp") or 0,
                faction = getElementData(player, "char:dutyfaction")
            }
            
            local event = createPlayerEvent("player_status_sync", player, data)
            EventQueue.add(event)
        end
    end
end

setTimer(syncPlayerDetails, Config.STATUS_SYNC_INTERVAL, 0)

addEventHandler("onPlayerLogin", root, function()
    setTimer(function(p)
        if isElement(p) then
            local data = {
                money = getElementData(p, "char:money") or 0,
                bank = getElementData(p, "char:bankmoney") or 0,
                level = getElementData(p, "Sys:Level") or 1,
                xp = getElementData(p, "LSys:EXP") or 0,
                job = getElementData(p, "job") or "Desempregado",
                playedTime = getElementData(p, "char:playedTime") or 0,
                id = getElementData(p, "char:id"),
                thirst = getElementData(p, "char:thirst") or 100,
                hunger = getElementData(p, "char:hunger") or 100,
                pp = getElementData(p, "char:pp") or 0,
            }
            local event = createPlayerEvent("initial_player_sync", p, data)
            EventQueue.add(event)
        end
    end, 5000, 1, source)
end)

if Config.DEBUG then
    outputDebugString("[Analytics] Player details collector loaded")
end
