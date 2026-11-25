import { httpClient } from './http-client';
import { useAuthStore } from '@/stores/auth-store';
import {
  MOCK_ECONOMIC_SNAPSHOT,
  MOCK_TRANSACTIONS,
  getMockEconomyTimeSeries,
} from '@/mocks/telemetry-snapshot';
import {
  EconomicSnapshot,
  EconomyTimeSeriesPoint,
  Transaction,
} from '@/types/telemetry';

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

  getTimeSeries: async (
    metric: string,
    period: string,
  ): Promise<EconomyTimeSeriesPoint[]> => {
    if (isDemo()) {
      return getMockEconomyTimeSeries(metric, period);
    }
    const response = await httpClient.get<EconomyTimeSeriesPoint[]>('/economy/timeseries', {
      params: { metric, period },
    });
    return response.data;
  },

  getRecentTransactions: async (
    limit: number = 50,
    category: 'ALL' | 'EARN' | 'SPEND' = 'ALL',
  ): Promise<Transaction[]> => {
    if (isDemo()) {
      const filtered = MOCK_TRANSACTIONS.filter((tx) => {
        if (category === 'ALL') return true;
        if (category === 'EARN') {
          return tx.type === 'EARN' || tx.type === 'TRANSFER_IN' || tx.type === 'ADMIN_ADD';
        }
        return tx.type === 'SPEND' || tx.type === 'TRANSFER_OUT' || tx.type === 'ADMIN_REMOVE';
      });
      return filtered.slice(0, limit);
    }
    const response = await httpClient.get<Transaction[]>('/economy/transactions/recent', {
      params: { limit, category },
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
