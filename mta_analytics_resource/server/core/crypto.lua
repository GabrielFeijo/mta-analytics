MtaAnalyticsCrypto = {}

function MtaAnalyticsCrypto.sha256(message)
    return string.lower(hash("sha256", tostring(message or "")))
end

function MtaAnalyticsCrypto.hmacSha256(secretKey, message)
    local key = tostring(secretKey or Config.API.secret or "")
    local msg = tostring(message or "")
    return MtaAnalyticsCrypto.sha256(key .. ":" .. msg)
end

function MtaAnalyticsCrypto.createSignature(apiKey, timestamp)
    local payload = tostring(apiKey or "") .. ":" .. tostring(timestamp or "")
    return MtaAnalyticsCrypto.sha256(payload)
end

function MtaAnalyticsCrypto.createHmacSignature(apiKey, timestamp, secretKey)
    local payload = tostring(apiKey or "") .. ":" .. tostring(timestamp or "")
    return MtaAnalyticsCrypto.hmacSha256(secretKey or Config.API.secret, payload)
end

Crypto = MtaAnalyticsCrypto
