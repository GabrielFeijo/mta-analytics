addEventHandler("onPlayerDamage", root, function(attacker, weapon, bodypart, loss)
    if not Config.COLLECT_EVENTS.PLAYER_DAMAGE then return end
    
    local attackerName = attacker and getPlayerName(attacker) or "Unknown"
    local attackerSerial = attacker and getPlayerSerial(attacker) or nil
    
    local event = createPlayerEvent("player_damage", source, {
        attacker = attackerName,
        attackerSerial = attackerSerial,
        weapon = weapon,
        bodypart = bodypart,
        damage = loss
    })
    
    EventQueue.add(event)
end)

addEventHandler("onPlayerVehicleEnter", root, function(vehicle, seat)
    if not Config.COLLECT_EVENTS.VEHICLE_ENTER then return end
    
    local event = createPlayerEvent("vehicle_enter", source, {
        vehicleModel = getElementModel(vehicle),
        seat = seat
    })
    
    EventQueue.add(event)
end)

addEventHandler("onPlayerVehicleExit", root, function(vehicle, seat)
    if not Config.COLLECT_EVENTS.VEHICLE_EXIT then return end
    
    local event = createPlayerEvent("vehicle_exit", source, {
        vehicleModel = getElementModel(vehicle),
        seat = seat
    })
    
    EventQueue.add(event)
end)

if Config.DEBUG then
    outputDebugString("[Analytics] Combat events collector loaded")
end
