# `mta_analytics_resource` — Coletor de Telemetria MTA:SA (`Garage Night`)

Resource Lua de coleta assíncrona de telemetria, economia, combate, multas e corridas clandestinas (`mta_racing`) para a plataforma **MTA Analytics**.

## Arquitetura Modular

```text
mta_analytics_resource/
├── meta.xml
├── config.lua
├── shared/
│   └── utils.lua
├── server/
│   ├── main.lua
│   ├── core/
│   │   ├── crypto.lua
│   │   ├── queue.lua
│   │   ├── request.lua
│   │   └── exports.lua
│   └── collectors/
│       ├── player_events.lua
│       ├── player_details.lua
│       ├── economy_events.lua
│       └── combat_events.lua
└── client/
    ├── main.lua
    └── events/
        └── player.lua
```

## Exports Server-Side

```lua
exports["mta_analytics_resource"]:logTransaction(player, transType, amount, description)
exports["mta_analytics_resource"]:logVehiclePurchase(player, model, price, paymentMethod)
exports["mta_analytics_resource"]:logFine(player, amount, reason, plate)
exports["mta_analytics_resource"]:logEvent(player, eventType, data)
exports["mta_analytics_resource"]:getQueueStatus()
```
