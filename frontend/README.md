# 🎨 MTA Analytics Frontend - Dashboard Interativo em Tempo Real

> Interface moderna e responsiva com visualizações 3D, gráficos interativos e WebSocket real-time

[![React](https://img.shields.io/badge/React-18.2-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0-purple?logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Three.js](https://img.shields.io/badge/Three.js-0.160-black?logo=three.js)](https://threejs.org/)

## 📋 Sobre

O **MTA Analytics Frontend** é a interface visual completa da plataforma, oferecendo:

- **Dashboard Interativo**: Métricas em tempo real via WebSocket
- **Visualizações 3D**: Mapa de calor com Three.js sobre o mapa do servidor
- **Gráficos Responsivos**: Recharts com D3 para análises complexas
- **UI Moderna**: Radix UI + Tailwind CSS design system
- **Type Safe**: TypeScript em 100% do código
- **Rápido**: Vite para dev/build otimizado

---

## 🌐 Demonstração

### Local
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3000](http://localhost:3000)

---

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+
- Backend rodando em `http://localhost:3000`

### Instalação Manual

1. **Instale dependências**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure .env** (opcional)
   ```bash
   cp .env.example .env
   ```
   
   ```env
   VITE_API_URL=http://localhost:3000
   ```

3. **Inicie dev server**
   ```bash
   npm run dev
   ```

4. **Acesse**
   - Abra [http://localhost:5173](http://localhost:5173)

---

## 📊 Scripts

```bash
# Desenvolvimento
npm run dev              # Dev server (localhost:5173)
npm run build            # Build otimizado para produção
npm run preview          # Preview do build

# Type checking
npm run type-check       # Apenas verificar tipos

# Linting (se configurado)
npm run lint
npm run format
```