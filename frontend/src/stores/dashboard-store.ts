import { create } from 'zustand';
import {
  DashboardStats,
  EconomicSnapshot,
  RecentEvent,
} from '@/types/telemetry';

interface DashboardState {
  stats: DashboardStats | null;
  recentEvents: RecentEvent[];

  setStats: (stats: DashboardStats) => void;
  addEvent: (event: RecentEvent) => void;
  updatePlayerCount: (count: number) => void;
  adjustPlayerCount: (delta: number) => void;
  updateEconomicSnapshot: (snapshot: EconomicSnapshot) => void;
  reset: () => void;
}

function mergeRecentEvents(incoming: RecentEvent[], current: RecentEvent[]): RecentEvent[] {
  const byId = new Map<string, RecentEvent>();
  for (const ev of [...current, ...incoming]) {
    const key = String(ev.id ?? `${ev.eventType}-${ev.timestamp}`);
    if (!byId.has(key)) {
      byId.set(key, ev);
    }
  }
  return Array.from(byId.values())
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 50);
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  recentEvents: [],

  setStats: (stats) =>
    set((state) => {
      const mergedEvents = mergeRecentEvents(stats?.recentEvents || [], state.recentEvents);
      return {
        stats: stats ? { ...stats, recentEvents: mergedEvents } : null,
        recentEvents: mergedEvents,
      };
    }),

  addEvent: (event) =>
    set((state) => {
      const nextEvents = mergeRecentEvents([event], state.recentEvents);
      return {
        recentEvents: nextEvents,
        stats: state.stats ? { ...state.stats, recentEvents: nextEvents } : state.stats,
      };
    }),

  updatePlayerCount: (count) =>
    set((state) => ({
      stats: state.stats ? { ...state.stats, onlinePlayers: Math.max(0, count) } : null,
    })),

  adjustPlayerCount: (delta) =>
    set((state) => {
      if (!state.stats) return state;
      const current = Number(state.stats.onlinePlayers) || 0;
      return {
        stats: {
          ...state.stats,
          onlinePlayers: Math.max(0, current + delta),
        },
      };
    }),

  updateEconomicSnapshot: (snapshot) =>
    set((state) => ({
      stats: state.stats ? { ...state.stats, economicSnapshot: snapshot } : null,
    })),

  reset: () => set({ stats: null, recentEvents: [] }),
}));
