function trackMoneyChange(player, amount, newBalance, source)
    if not Config.COLLECT_EVENTS.MONEY_CHANGE then return end
    
    local event = createPlayerEvent("player_money_change", player, {
        amount = amount,
        newBalance = newBalance,
        source = source
    })
    
    EventQueue.add(event)
end

function onMoneyChange(player, amount, newBalance, source)
    trackMoneyChange(player, amount, newBalance, source)
end

if Config.DEBUG then
    outputDebugString("[Analytics] Economy events collector loaded")
end
