MtaAnalyticsQueue = {}
MtaAnalyticsQueue.events = {}
MtaAnalyticsQueue.timer = nil
MtaAnalyticsQueue.totalQueued = 0
MtaAnalyticsQueue.totalDropped = 0

local function trimBufferIfNeeded()
    local maxSize = Config.Queue.maxBufferSize or 500
    while #MtaAnalyticsQueue.events > maxSize do
        table.remove(MtaAnalyticsQueue.events, 1)
        MtaAnalyticsQueue.totalDropped = MtaAnalyticsQueue.totalDropped + 1
    end
end

function MtaAnalyticsQueue.recordDropped(count)
    local amount = tonumber(count) or 0
    if amount > 0 then
        MtaAnalyticsQueue.totalDropped = MtaAnalyticsQueue.totalDropped + amount
    end
end

function MtaAnalyticsQueue.add(event)
    if type(event) ~= "table" or not event.eventType then
        return false
    end

    table.insert(MtaAnalyticsQueue.events, event)
    MtaAnalyticsQueue.totalQueued = MtaAnalyticsQueue.totalQueued + 1
    trimBufferIfNeeded()

    MtaAnalyticsUtils.debugLog(
        "Evento enfileirado: " .. tostring(event.eventType) .. " (" .. tostring(#MtaAnalyticsQueue.events) .. " na fila)"
    )

    if #MtaAnalyticsQueue.events >= (Config.Queue.batchSize or 15) then
        MtaAnalyticsQueue.flush(false)
    end
    return true
end

function MtaAnalyticsQueue.requeueBatch(failedEvents)
    if type(failedEvents) ~= "table" or #failedEvents == 0 then
        return
    end
    for i = #failedEvents, 1, -1 do
        table.insert(MtaAnalyticsQueue.events, 1, failedEvents[i])
    end
    trimBufferIfNeeded()
end

function MtaAnalyticsQueue.flush(forceFlush)
    if #MtaAnalyticsQueue.events == 0 then
        return false
    end
    if MtaAnalyticsRequest and not MtaAnalyticsRequest.canDispatch(forceFlush) then
        return false
    end

    local batchLimit = math.min(#MtaAnalyticsQueue.events, (Config.Queue.batchSize or 15) * 4)
    local batch = {}
    for i = 1, batchLimit do
        batch[i] = MtaAnalyticsQueue.events[i]
    end
    for _ = 1, batchLimit do
        table.remove(MtaAnalyticsQueue.events, 1)
    end

    MtaAnalyticsRequest.sendBatch(batch)
    return true
end

function MtaAnalyticsQueue.startTimer()
    MtaAnalyticsQueue.stopTimer()
    MtaAnalyticsQueue.timer = setTimer(function()
        MtaAnalyticsQueue.flush(false)
    end, Config.Queue.flushIntervalMs or 5000, 0)
end

function MtaAnalyticsQueue.stopTimer()
    if MtaAnalyticsQueue.timer and isTimer(MtaAnalyticsQueue.timer) then
        killTimer(MtaAnalyticsQueue.timer)
    end
    MtaAnalyticsQueue.timer = nil
end

function MtaAnalyticsQueue.getStatus()
    local reqStatus = MtaAnalyticsRequest and MtaAnalyticsRequest.getStatus and MtaAnalyticsRequest.getStatus() or {}
    return {
        pending = #MtaAnalyticsQueue.events,
        totalQueued = MtaAnalyticsQueue.totalQueued,
        totalDropped = MtaAnalyticsQueue.totalDropped,
        circuitOpen = MtaAnalyticsRequest and MtaAnalyticsRequest.isCircuitOpen() or false,
        circuitState = reqStatus.state or "CLOSED",
        inFlight = reqStatus.inFlight or 0,
    }
end
