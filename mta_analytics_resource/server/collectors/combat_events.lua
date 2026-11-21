addEventHandler("onPlayerDamage", root, function(attacker, weapon, bodypart, loss)
    if not Config.Collectors.PLAYER_DAMAGE then
        return
    end

    local attackerName = "Ambiente"
    local attackerSerial = nil
    if MtaAnalyticsUtils.isValidPlayer(attacker) then
        attackerName = MtaAnalyticsUtils.stripHex(getPlayerName(attacker))
        attackerSerial = getPlayerSerial(attacker)
    end

    local event = MtaAnalyticsUtils.buildPlayerEvent("player_damage", source, {
        attacker = attackerName,
        attackerSerial = attackerSerial,
        weapon = weapon,
        bodypart = bodypart,
        damage = tonumber(loss) or 0,
    })
    MtaAnalyticsQueue.add(event)
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
