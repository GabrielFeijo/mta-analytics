import { httpClient } from './http-client';
import { useAuthStore } from '@/stores/auth-store';
import {
  MOCK_ECONOMIC_SNAPSHOT,
  MOCK_TRANSACTIONS,
} from '@/mocks/telemetry-snapshot';
import { EconomicSnapshot, Transaction } from '@/types/telemetry';

function isDemo(): boolean {
  return useAuthStore.getState().isDemoMode;
}

export const economyApi = {
  getSnapshot: async (): Promise<EconomicSnapshot> => {
    if (isDemo()) {
      return MOCK_ECONOMIC_SNAPSHOT;
    }
    const response = await httpClient.get<EconomicSnapshot>('/economy/snapshot');
    return response.data;
  },

  getTimeSeries: async (metric: string, period: string) => {
    if (isDemo()) {
      return [];
    }
    const response = await httpClient.get('/economy/timeseries', {
      params: { metric, period },
    });
    return response.data;
  },

  getRecentTransactions: async (limit: number = 50): Promise<Transaction[]> => {
    if (isDemo()) {
      return MOCK_TRANSACTIONS.slice(0, limit);
    }
    const response = await httpClient.get<Transaction[]>('/economy/transactions/recent', {
      params: { limit },
    });
    return response.data;
  },

  getPlayerTransactions: async (
    playerId: number,
    limit: number = 50,
  ): Promise<Transaction[]> => {
    if (isDemo()) {
      return MOCK_TRANSACTIONS.filter((t) => t.playerId === playerId).slice(0, limit);
    }
    const response = await httpClient.get<Transaction[]>(
      `/economy/transactions/player/${playerId}`,
      { params: { limit } },
    );
    return response.data;
  },
};
