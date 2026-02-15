import { create } from 'zustand';

interface DashboardState {
    stats: any | null;
    onlinePlayers: any[];
    recentEvents: any[];

    setStats: (stats: any) => void;
    setOnlinePlayers: (players: any[]) => void;
    addEvent: (event: any) => void;
    updatePlayerCount: (count: number) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
    stats: null,
    onlinePlayers: [],
    recentEvents: [],

    setStats: (stats) => set({ stats }),

    setOnlinePlayers: (players) => set({ onlinePlayers: players }),

    addEvent: (event) =>
        set((state) => ({
            recentEvents: [event, ...state.recentEvents].slice(0, 50),
        })),

    updatePlayerCount: (count) =>
        set((state) => ({
            stats: state.stats
                ? { ...state.stats, onlinePlayers: count }
                : null,
        })),
}));
