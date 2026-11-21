import { httpClient } from './http-client';
import { useAuthStore } from '@/stores/auth-store';
import { MOCK_PLAYERS } from '@/mocks/telemetry-snapshot';
import { Player } from '@/types/telemetry';

function isDemo(): boolean {
  return useAuthStore.getState().isDemoMode;
}

export const playersApi = {
  getOnlinePlayers: async (): Promise<Player[]> => {
    if (isDemo()) {
      return MOCK_PLAYERS;
    }
    const response = await httpClient.get<Player[]>('/players/online');
    return response.data;
  },

  getPlayer: async (id: number): Promise<Player> => {
    if (isDemo()) {
      return MOCK_PLAYERS.find((p) => p.id === id) || MOCK_PLAYERS[0];
    }
    const response = await httpClient.get<Player>(`/players/${id}`);
    return response.data;
  },

  searchPlayers: async (query: string): Promise<Player[]> => {
    if (isDemo()) {
      const q = query.toLowerCase();
      return MOCK_PLAYERS.filter(
        (p) =>
          p.lastUsername?.toLowerCase().includes(q) ||
          p.serial.toLowerCase().includes(q) ||
          p.job?.toLowerCase().includes(q) ||
          p.faction?.toLowerCase().includes(q),
      );
    }
    const response = await httpClient.get<Player[]>('/players/search', {
      params: { q: query },
    });
    return response.data;
  },
};
