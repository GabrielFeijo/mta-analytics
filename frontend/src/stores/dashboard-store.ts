import { create } from 'zustand';
import {
  DashboardStats,
  EconomicSnapshot,
  Player,
  RecentEvent,
} from '@/types/telemetry';

interface DashboardState {
  stats: DashboardStats | null;
  onlinePlayers: Player[];
  recentEvents: RecentEvent[];

  setStats: (stats: DashboardStats) => void;
  setOnlinePlayers: (players: Player[]) => void;
  addEvent: (event: RecentEvent) => void;
  updatePlayerCount: (count: number) => void;
  adjustPlayerCount: (delta: number) => void;
  updateEconomicSnapshot: (snapshot: EconomicSnapshot) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  onlinePlayers: [],
  recentEvents: [],

  setStats: (stats) =>
    set({
      stats,
      recentEvents: stats?.recentEvents || [],
    }),

  setOnlinePlayers: (players) => set({ onlinePlayers: players }),

  addEvent: (event) =>
    set((state) => {
      const nextEvents = [event, ...state.recentEvents].slice(0, 50);
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
}));
