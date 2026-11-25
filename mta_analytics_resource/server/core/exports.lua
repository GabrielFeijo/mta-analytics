function logTransaction(player, transType, amount, description)
    if not MtaAnalyticsUtils.isValidPlayer(player) then
        return false
    end

    local numericAmount = tonumber(amount)
    if not MtaAnalyticsUtils.isFiniteNumber(numericAmount) or numericAmount == 0 then
        return false
    end

    local callerName = sourceResource and getResourceName(sourceResource) or "unknown"
    local snapshot = MtaAnalyticsUtils.buildPlayerSnapshot(player)

    local event = MtaAnalyticsUtils.buildPlayerEvent("player_transaction", player, {
        type = tostring(transType or "unknown"),
        amount = numericAmount,
        description = tostring(description or ""),
        source_resource = callerName,
        money = snapshot.money,
        bank = snapshot.bank,
        dirtyMoney = snapshot.dirtyMoney,
        id = snapshot.id,
    })

    return MtaAnalyticsQueue.add(event)
end

function logMoneyChange(player, amount, newBalance, changeSource)
    if not MtaAnalyticsUtils.isValidPlayer(player) then
        return false
    end

    local numericAmount = tonumber(amount)
    if not MtaAnalyticsUtils.isFiniteNumber(numericAmount) or numericAmount == 0 then
        return false
    end

    local parsedBalance = tonumber(newBalance)
    local safeBalance = MtaAnalyticsUtils.isFiniteNumber(parsedBalance) and parsedBalance or 0
    local callerName = sourceResource and getResourceName(sourceResource) or "unknown"
    local event = MtaAnalyticsUtils.buildPlayerEvent("player_money_change", player, {
        amount = numericAmount,
        newBalance = safeBalance,
        source = tostring(changeSource or callerName),
        source_resource = callerName,
    })

    return MtaAnalyticsQueue.add(event)
end

function logVehiclePurchase(player, model, price, paymentMethod)
    if not MtaAnalyticsUtils.isValidPlayer(player) then
        return false
    end

    local modelId = tonumber(model) or 0
    local numericPrice = tonumber(price)
    if not MtaAnalyticsUtils.isFiniteNumber(numericPrice) or numericPrice <= 0 then
        return false
    end

    local callerName = sourceResource and getResourceName(sourceResource) or "unknown"
    local snapshot = MtaAnalyticsUtils.buildPlayerSnapshot(player)

    local event = MtaAnalyticsUtils.buildPlayerEvent("vehicle_purchase", player, {
        model = modelId,
        price = numericPrice,
        paymentMethod = tostring(paymentMethod or "money"),
        vehicleName = (modelId > 0 and getVehicleNameFromModel(modelId)) or "Unknown",
        source_resource = callerName,
        money = snapshot.money,
        bank = snapshot.bank,
    })

    return MtaAnalyticsQueue.add(event)
end

function logFine(player, amount, reason, plate)
    if not MtaAnalyticsUtils.isValidPlayer(player) then
        return false
    end

    local numericAmount = tonumber(amount)
    if not MtaAnalyticsUtils.isFiniteNumber(numericAmount) or numericAmount <= 0 then
        return false
    end

    local callerName = sourceResource and getResourceName(sourceResource) or "unknown"
    local snapshot = MtaAnalyticsUtils.buildPlayerSnapshot(player)
    local event = MtaAnalyticsUtils.buildPlayerEvent("fine_issued", player, {
        amount = numericAmount,
        reason = tostring(reason or "Infração de trânsito"),
        plate = tostring(plate or "SEM-PLACA"),
        source_resource = callerName,
        money = snapshot.money,
        bank = snapshot.bank,
    })

    return MtaAnalyticsQueue.add(event)
end

function logEvent(player, eventType, data)
    if not MtaAnalyticsUtils.isValidPlayer(player) then
        return false
    end
    if type(eventType) ~= "string" or eventType == "" then
        return false
    end

    local eventData = {}
    if type(data) == "table" then
        for k, v in pairs(data) do
            eventData[k] = v
        end
    end
    eventData.source_resource = sourceResource and getResourceName(sourceResource) or "unknown"

    local event = MtaAnalyticsUtils.buildPlayerEvent(eventType, player, eventData)
    return MtaAnalyticsQueue.add(event)
end

function getQueueStatus()
    return MtaAnalyticsQueue.getStatus()
end
