# `mta_analytics_resource` — Coletor de Telemetria MTA:SA (`Garage Night`)

Resource Lua **100% server-side** de coleta assíncrona de telemetria, economia, combate, multas e corridas clandestinas (`mta_racing`) para a plataforma **MTA Analytics**.

## Arquitetura Modular (`kebab-case`)

```text
mta_analytics_resource/
├── meta.xml
└── server/
    ├── config.lua
    ├── main.lua
    ├── core/
    │   ├── crypto.lua       # HMAC-SHA256 (RFC 2104) sobre timestamp + body
    │   ├── exports.lua      # API pública de exports para outros resources
    │   ├── queue.lua        # Buffer local com batching e controle de descarte
    │   ├── request.lua      # HTTP client + Circuit Breaker FSM + backoff
    │   └── utils.lua        # Sanitização, snapshot de elementData e JSON
    └── collectors/
        ├── combat-events.lua    # Dano agregado (janela 1.5s) e veículos
        ├── player-details.lua   # Sincronização periódica e inicial de perfil
        └── player-events.lua    # Join, quit, spawn, óbito e chat
```

## Segurança

- As credenciais (`Config.API.key` e `Config.API.secret`) residem exclusivamente em `server/config.lua` (`type="server"` no `meta.xml`) e nunca são enviadas ao client.
- Cada requisição envia `x-api-key`, `x-timestamp` e `x-hmac-signature` (`HMAC-SHA256(secret, timestamp .. "." .. body)`).

## Exports Server-Side

```lua
exports["mta_analytics_resource"]:logTransaction(player, transType, amount, description)
exports["mta_analytics_resource"]:logMoneyChange(player, amount, newBalance, changeSource)
exports["mta_analytics_resource"]:logVehiclePurchase(player, model, price, paymentMethod)
exports["mta_analytics_resource"]:logFine(player, amount, reason, plate)
exports["mta_analytics_resource"]:logEvent(player, eventType, data)
exports["mta_analytics_resource"]:getQueueStatus()
```
