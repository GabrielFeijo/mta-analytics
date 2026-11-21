MtaAnalyticsCrypto = {}

local BLOCK_SIZE = 64

local function xorByte(a, b)
    if type(bitXor) == "function" then
        return bitXor(a, b)
    end
    local res = 0
    local bitVal = 1
    while a > 0 or b > 0 do
        local ra = a % 2
        local rb = b % 2
        if ra ~= rb then
            res = res + bitVal
        end
        a = (a - ra) / 2
        b = (b - rb) / 2
        bitVal = bitVal * 2
    end
    return res
end

local function hexToBytes(hex)
    return (tostring(hex or ""):gsub("..", function(cc)
        return string.char(tonumber(cc, 16) or 0)
    end))
end

function MtaAnalyticsCrypto.sha256(message)
    return string.lower(hash("sha256", tostring(message or "")))
end

function MtaAnalyticsCrypto.hmacSha256(secretKey, message)
    local key = tostring(secretKey or Config.API.secret or "")
    local msg = tostring(message or "")

    if #key > BLOCK_SIZE then
        key = hexToBytes(MtaAnalyticsCrypto.sha256(key))
    end
    if #key < BLOCK_SIZE then
        key = key .. string.rep("\0", BLOCK_SIZE - #key)
    end

    local ipadBytes = {}
    local opadBytes = {}
    for i = 1, BLOCK_SIZE do
        local b = string.byte(key, i)
        ipadBytes[i] = string.char(xorByte(b, 0x36))
        opadBytes[i] = string.char(xorByte(b, 0x5c))
    end

    local innerHex = MtaAnalyticsCrypto.sha256(table.concat(ipadBytes) .. msg)
    return MtaAnalyticsCrypto.sha256(table.concat(opadBytes) .. hexToBytes(innerHex))
end

function MtaAnalyticsCrypto.signRequest(timestamp, body, secretKey)
    local payload = tostring(timestamp or "") .. "." .. tostring(body or "")
    return MtaAnalyticsCrypto.hmacSha256(secretKey or Config.API.secret, payload)
end
