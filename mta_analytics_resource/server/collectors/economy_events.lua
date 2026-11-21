MtaAnalyticsEconomy = {}

function MtaAnalyticsEconomy.trackMoneyChange(player, amount, newBalance, changeSource)
    if not Config.Collectors.MONEY_CHANGE or not MtaAnalyticsUtils.isValidPlayer(player) then
        return false
    end

    local event = MtaAnalyticsUtils.buildPlayerEvent("player_money_change", player, {
        amount = tonumber(amount) or 0,
        newBalance = tonumber(newBalance) or 0,
        source = tostring(changeSource or "unknown"),
    })
    return MtaAnalyticsQueue.add(event)
end

trackMoneyChange = MtaAnalyticsEconomy.trackMoneyChange
onMoneyChange = MtaAnalyticsEconomy.trackMoneyChange
