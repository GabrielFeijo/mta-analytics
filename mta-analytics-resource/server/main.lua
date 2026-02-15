addEventHandler("onResourceStart", resourceRoot, function()
    outputDebugString("===========================================")
    outputDebugString("[Analytics] Starting MTA Analytics System")
    outputDebugString("===========================================")
    
    EventQueue.startTimer()
    
    setTimer(function()
        Request.sendHeartbeat()
    end, 60000, 0)
    
    outputDebugString("[Analytics] System started successfully")
    outputDebugString("[Analytics] API URL: " .. Config.API_URL)
    outputDebugString("[Analytics] Batch Size: " .. Config.BATCH_SIZE)
    outputDebugString("[Analytics] Batch Interval: " .. Config.BATCH_INTERVAL .. "ms")
end)

addEventHandler("onResourceStop", resourceRoot, function()
    EventQueue.flush()
    EventQueue.stopTimer()
    
    outputDebugString("[Analytics] System stopped")
end)

setTimer(function()
    for _, player in ipairs(getElementsByType("player")) do
        local x, y, z = getElementPosition(player)
        local event = createPlayerEvent("player_position", player, {
            position = { x = x, y = y, z = z }
        })
        EventQueue.add(event)
    end
end, Config.POSITION_TRACK_INTERVAL, 0)

if Config.DEBUG then
    outputDebugString("[Analytics] Main server script loaded")
end