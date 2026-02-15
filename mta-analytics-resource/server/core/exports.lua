function logTransaction(player, transType, amount, description)
    if not player or not isElement(player) or getElementType(player) ~= "player" then return false end
    
    local event = createPlayerEvent("player_transaction", player, {
        type = transType,
        amount = amount,
        description = description or "",
        source_resource = sourceResource and getResourceName(sourceResource) or "unknown"
    })
    
    EventQueue.add(event)
    return true
end

function logVehiclePurchase(player, model, price, paymentMethod)
    if not player or not isElement(player) or getElementType(player) ~= "player" then return false end
    
    local event = createPlayerEvent("vehicle_purchase", player, {
        model = model,
        price = price,
        paymentMethod = paymentMethod or "money",
        vehicleName = getVehicleNameFromModel(model) or "Unknown",
        source_resource = sourceResource and getResourceName(sourceResource) or "unknown"
    })
    
    EventQueue.add(event)
    return true
end

function logEvent(player, eventType, data)
    if not player or not isElement(player) or getElementType(player) ~= "player" then return false end
    if not eventType or type(eventType) ~= "string" then return false end
    
    local eventData = data or {}
    eventData.source_resource = sourceResource and getResourceName(sourceResource) or "unknown"
    
    local event = createPlayerEvent(eventType, player, eventData)
    
    EventQueue.add(event)
    return true
end
