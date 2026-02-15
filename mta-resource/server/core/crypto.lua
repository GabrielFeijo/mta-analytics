Crypto = {}

function Crypto.hmacSha256(key, message)
    local hash = hash("sha256", message)
    return hash
end

function Crypto.createSignature(apiKey, timestamp)
    local payload = apiKey .. ":" .. timestamp
    return Crypto.hmacSha256(Config.API_SECRET, payload)
end

if Config.DEBUG then
    outputDebugString("[Analytics] Crypto module loaded")
end
