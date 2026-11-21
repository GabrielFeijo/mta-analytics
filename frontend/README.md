# MTA Analytics Frontend - Dashboard Interativo em Tempo Real

Interface SPA em React + TypeScript + Tailwind CSS (tema **Garage Night**) com WebSocket único, gráficos Recharts e cartografia térmica 2D em Canvas sobre o mapa de San Andreas.

## Destaques Técnicos

- **WebSocket Único**: `AnalyticsSocketProvider` centraliza a conexão Socket.IO em `/analytics` para toda a aplicação.
- **Cartografia Térmica 2D**: Mapa de calor interativo em Canvas (`-3000` a `+3000`) com camadas por tipo de evento e inspeção de coordenadas por zona.
- **Gráficos & Auditoria**: Recharts para fluxo econômico de 7 dias, tabelas de transações, multas de radar, concessionárias, corridas (`mta_racing`) e fichas de pilotos com debounce na busca.
- **Modo Snapshot Local**: Dados simulados isolados em `src/mocks/telemetry-snapshot.ts`, ativados apenas explicitamente pelo usuário na tela de login.
- **Padronização**: Arquitetura modular 100% em `kebab-case` com tipagem TypeScript estrita.

## Instalação Manual

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Scripts

```bash
npm run dev         # Dev server (http://localhost:5173)
npm run type-check  # Verificação estrita de tipos (tsc --noEmit)
npm run build       # Type-check + build de produção (dist/)
npm run preview     # Preview do build de produção
```
