
EventQueue = {}
EventQueue.events = {}
EventQueue.timer = nil

function EventQueue.add(event)
    table.insert(EventQueue.events, event)
    
    if Config.DEBUG then
        outputDebugString("[Analytics] Event queued: " .. event.eventType .. " (Queue size: " .. #EventQueue.events .. ")")
    end
    
    if #EventQueue.events >= Config.BATCH_SIZE then
        EventQueue.flush()
    end
end

function EventQueue.flush()
    if #EventQueue.events == 0 then
        return
    end
    
    local eventsToSend = EventQueue.events
    EventQueue.events = {}
    
    if Config.DEBUG then
        outputDebugString("[Analytics] Flushing " .. #eventsToSend .. " events")
    end
    
    Request.sendBatch(eventsToSend)
end

function EventQueue.startTimer()
    EventQueue.timer = setTimer(function()
        EventQueue.flush()
    end, Config.BATCH_INTERVAL, 0)
    
    if Config.DEBUG then
        outputDebugString("[Analytics] Queue timer started")
    end
end

function EventQueue.stopTimer()
    if EventQueue.timer then
        killTimer(EventQueue.timer)
        EventQueue.timer = nil
    end
end

if Config.DEBUG then
    outputDebugString("[Analytics] Queue module loaded")
end
