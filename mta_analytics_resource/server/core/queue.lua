MtaAnalyticsQueue = {}
MtaAnalyticsQueue.events = {}
MtaAnalyticsQueue.timer = nil
MtaAnalyticsQueue.totalQueued = 0
MtaAnalyticsQueue.totalDropped = 0

local MAX_BACKEND_BATCH_SIZE = 200
local MAX_FORCE_FLUSH_BATCHES = 3

local function trimBufferIfNeeded()
    local maxSize = Config.Queue.maxBufferSize or 500
    local total = #MtaAnalyticsQueue.events
    if total <= maxSize then
        return
    end

    local overflow = total - maxSize
    local kept = {}
    for i = overflow + 1, total do
        kept[#kept + 1] = MtaAnalyticsQueue.events[i]
    end
    MtaAnalyticsQueue.events = kept
    MtaAnalyticsQueue.totalDropped = MtaAnalyticsQueue.totalDropped + overflow
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

    MtaAnalyticsQueue.events[#MtaAnalyticsQueue.events + 1] = event
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

    local merged = {}
    for i = 1, #failedEvents do
        merged[i] = failedEvents[i]
    end
    local existing = MtaAnalyticsQueue.events
    local offset = #merged
    for i = 1, #existing do
        merged[offset + i] = existing[i]
    end
    MtaAnalyticsQueue.events = merged
    trimBufferIfNeeded()
end

function MtaAnalyticsQueue.flush(forceFlush)
    if #MtaAnalyticsQueue.events == 0 then
        return false
    end

    local maxIterations = forceFlush and MAX_FORCE_FLUSH_BATCHES or 1
    local dispatched = false

    for _ = 1, maxIterations do
        local total = #MtaAnalyticsQueue.events
        if total == 0 then
            break
        end
        if MtaAnalyticsRequest and not MtaAnalyticsRequest.canDispatch(forceFlush) then
            break
        end

        local configuredMax = math.min((Config.Queue.batchSize or 15) * 4, MAX_BACKEND_BATCH_SIZE)
        local batchLimit = math.min(total, math.max(1, configuredMax))
        local batch = {}
        local remaining = {}

        for i = 1, batchLimit do
            batch[i] = MtaAnalyticsQueue.events[i]
        end
        for i = batchLimit + 1, total do
            remaining[#remaining + 1] = MtaAnalyticsQueue.events[i]
        end
        MtaAnalyticsQueue.events = remaining

        MtaAnalyticsRequest.sendBatch(batch, forceFlush)
        dispatched = true
    end

    return dispatched
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
