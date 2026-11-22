# 📡 MTA Analytics Collector (`mta_analytics_resource`)

> Resource Lua **100% server-side** para **MTA:SA Roleplay** responsável por coletar telemetria de jogadores, combate agregado, economia, multas e corridas clandestinas (`mta_racing`), assinando lotes via **HMAC-SHA256 (RFC 2104)** e protegendo o servidor com buffer em memória e **Circuit Breaker FSM**.

[![MTA:SA](https://img.shields.io/badge/MTA%3ASA-%3E%3D1.5.9-1E2024?style=flat)](https://multitheftauto.com/)
[![Lua](https://img.shields.io/badge/Lua-Server--Only-2C2D72?logo=lua&logoColor=white)](https://www.lua.org/)
[![Security](https://img.shields.io/badge/Auth-HMAC--SHA256_RFC2104-D9482F)](server/core/crypto.lua)

---

## 🎯 Destaques

- **100% Server-Side (Zero Vazamento de Credenciais)**: `server/config.lua` e `server/core/utils.lua` rodam exclusivamente como `type="server"` no [`meta.xml`](meta.xml), impedindo que `Config.API.key` e `Config.API.secret` sejam baixados ou inspecionados pelo client MTA.
- **Assinatura Criptográfica HMAC-SHA256 (RFC 2104)**: [`server/core/crypto.lua`](server/core/crypto.lua) calcula HMAC-SHA256 completo (blocos de `64` bytes com `ipad`/`opad`) sobre `timestamp .. "." .. body`, enviando `x-api-key`, `x-timestamp` e `x-hmac-signature` compatíveis com o `ApiKeyGuard` do backend.
- **Circuit Breaker FSM & Backoff Exponencial**: [`server/core/request.lua`](server/core/request.lua) opera nos estados `CLOSED`, `OPEN` e `HALF_OPEN` com cooldown progressivo (`30s` até o teto de `300s`), impede envios concorrentes (`inFlightRequests`) e só re-enfileira falhas recuperáveis (`timeout`, HTTP `0`, `429`, `5xx`), descartando erros `4xx` sem travar a fila.
- **Agregação de Combate & Serialização JSON Segura**: [`combat-events.lua`](server/collectors/combat-events.lua) agrupa rajadas de `onPlayerDamage` em janela de `1500ms` (com flush imediato em `onPlayerWasted` e `onPlayerQuit`), enquanto [`utils.lua`](server/core/utils.lua) previne que tabelas vazias virem `[]` no `toJSON` nativo do MTA.

---

## 📊 Coletores Automáticos e ElementData

| Coletor (`Config.Collectors`) | Evento / Origem | Dados Capturados |
| :--- | :--- | :--- |
| `PLAYER_JOIN` | `onPlayerJoin` | Serial, nome limpo (sem hex `#RRGGBB`), posição e IP |
| `PLAYER_QUIT` | `onPlayerQuit` | Snapshot completo, `quitType`, `reason` e flush de dano pendente |
| `PLAYER_SPAWN` | `onPlayerSpawn` | Posição de spawn e identificador do personagem |
| `PLAYER_WASTED` | `onPlayerWasted` | Assassino (`killer`, `killerSerial`), arma e `bodypart` |
| `PLAYER_DAMAGE` | `onPlayerDamage` | Dano total agregado (`damage`), contagem de impactos (`hits`), arma e `bodypart` |
| `PLAYER_CHAT` | `onPlayerChat` | Mensagem e `messageType` |
| `VEHICLE_ENTER` / `VEHICLE_EXIT` | `onPlayerVehicleEnter` / `Exit` | `vehicleModel`, `vehicleName` e assento (`seat`) |
| `PLAYER_STATUS_SYNC` | Timer (`60s`) + `onPlayerLogin` | Saldo em mãos, banco, dinheiro sujo, nível, XP, emprego, facção, fome/sede e VPoints |
| `PLAYER_POSITION` | Timer (`30s`) | Coordenadas arredondadas, `dimension`, `interior` e `inVehicle` |

### Chaves `Config.ElementDataKeys` ([`server/config.lua`](server/config.lua))

`char:id` · `char:money` · `char:bankmoney` · `char:moneysujo` · `Sys:Level` · `LSys:EXP` · `job` · `char:playedTime` · `char:thirst` · `char:hunger` · `char:pp` · `char:dutyfaction`

---

## 🔌 Exports Server-Side ([`meta.xml`](meta.xml))

- `logTransaction(player, transType, amount, description)` → envia `player_transaction` com snapshot financeiro (`money`, `bank`, `dirtyMoney`) e `source_resource` automático
- `logMoneyChange(player, amount, newBalance, changeSource)` → envia `player_money_change` para alterações diretas de saldo
- `logVehiclePurchase(player, model, price, paymentMethod)` → envia `vehicle_purchase` com `vehicleName` resolvido pelo modelo
- `logFine(player, amount, reason, plate)` → envia `fine_issued` para multas de radar/trânsito
- `logEvent(player, eventType, data)` → envia evento customizado preservando `source_resource`
- `getQueueStatus()` → retorna `{ pending, totalQueued, totalDropped, circuitOpen, circuitState, inFlight }`

```lua
exports["mta_analytics_resource"]:logTransaction(player, "race_dirty_earn", 45000, "1º Lugar — High Stakes: El Corona")
exports["mta_analytics_resource"]:logMoneyChange(player, 22500, 185000, "spc_employment")
exports["mta_analytics_resource"]:logVehiclePurchase(player, 411, 285000, "bank")
exports["mta_analytics_resource"]:logFine(player, 4800, "Excesso de velocidade (198 km/h)", "R34-9981")
exports["mta_analytics_resource"]:logEvent(player, "faction_action", { action = "territory_capture", faction = "Garage Night" })
local status = exports["mta_analytics_resource"]:getQueueStatus()
```

---

## 📦 Estrutura do Projeto

```text
mta_analytics_resource/
├── server/
│   ├── collectors/
│   │   ├── combat-events.lua      # Agregação de dano (1500ms) e eventos de entrada/saída de veículos
│   │   ├── player-details.lua     # Sincronização periódica e inicial pós-login (initial_player_sync)
│   │   └── player-events.lua      # Eventos de join, quit, spawn, wasted e chat
│   ├── core/
│   │   ├── crypto.lua             # Implementação HMAC-SHA256 RFC 2104 (timestamp.body)
│   │   ├── exports.lua            # Exports públicos server-side para integração com o gamemode
│   │   ├── queue.lua              # Buffer FIFO limitado (max 500), batching e controle de descarte
│   │   ├── request.lua            # fetchRemote com Circuit Breaker FSM e backoff exponencial
│   │   └── utils.lua              # Sanitização de strings, snapshot elementData e serializer JSON
│   ├── config.lua                 # URL da API, chaves, intervalos, Circuit Breaker e elementData keys
│   └── main.lua                   # Timers de heartbeat, amostragem de posição e flush no onResourceStop
├── meta.xml                       # Manifesto server-only, exports e solicitação ACL (fetchRemote)
└── README.md                      # Documentação do coletor Lua
```

---

## 🚀 Ativação no Servidor MTA

1. Edite [`server/config.lua`](server/config.lua) definindo `Config.API.url`, `Config.API.key` e `Config.API.secret` exatamente como configurados no backend (`MTA_API_KEYS` e `MTA_SECRET`).
2. Conceda acesso ao direito `function.fetchRemote` no `acl.xml` ou via console (`aclrequest allow mta_analytics_resource all`).
3. No console do servidor MTA:

```text
refresh
start mta_analytics_resource
```

---

Desenvolvido por **Gabriel Feijó**.
