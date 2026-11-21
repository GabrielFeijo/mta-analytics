import { httpClient } from './http-client';
import { useAuthStore } from '@/stores/auth-store';
import {
  getMockDashboardStats,
  getMockFinesStats,
  getMockPlayerActivity,
  getMockResourcesStats,
  MOCK_HEATMAP_POINTS,
  MOCK_OVERVIEW_DATA,
  MOCK_SERVER_STATUS,
} from '@/mocks/telemetry-snapshot';
import {
  DashboardStats,
  FinesStats,
  HeatmapPoint,
  OverviewDayPoint,
  PlayerActivityEvent,
  RecentEvent,
  ResourcesStats,
  ServerStatus,
} from '@/types/telemetry';

function isDemo(): boolean {
  return useAuthStore.getState().isDemoMode;
}

export const analyticsApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    if (isDemo()) {
      return getMockDashboardStats();
    }
    const response = await httpClient.get<DashboardStats>('/analytics/dashboard');
    return response.data;
  },

  getServerStatus: async (): Promise<ServerStatus> => {
    if (isDemo()) {
      return MOCK_SERVER_STATUS;
    }
    const response = await httpClient.get<ServerStatus>('/analytics/server-status');
    return response.data;
  },

  getHeatmapData: async (params: {
    eventType: string;
    startDate: Date;
    endDate: Date;
  }): Promise<HeatmapPoint[]> => {
    if (isDemo()) {
      return MOCK_HEATMAP_POINTS;
    }
    const response = await httpClient.get<HeatmapPoint[]>('/analytics/heatmap', {
      params: {
        eventType: params.eventType,
        startDate: params.startDate.toISOString(),
        endDate: params.endDate.toISOString(),
      },
    });
    return response.data;
  },

  getPlayerActivity: async (
    playerId: number,
    hours: number = 24,
  ): Promise<PlayerActivityEvent[]> => {
    if (isDemo()) {
      return getMockPlayerActivity();
    }
    const response = await httpClient.get<PlayerActivityEvent[]>(
      `/analytics/players/${playerId}/activity`,
      { params: { hours } },
    );
    return response.data;
  },

  getRecentEvents: async (limit: number = 50): Promise<RecentEvent[]> => {
    if (isDemo()) {
      return getMockDashboardStats().recentEvents.slice(0, limit);
    }
    const response = await httpClient.get<RecentEvent[]>('/analytics/events/recent', {
      params: { limit },
    });
    return response.data;
  },

  getResourcesStats: async (hours: number = 24): Promise<ResourcesStats> => {
    if (isDemo()) {
      return getMockResourcesStats();
    }
    const response = await httpClient.get<ResourcesStats>('/analytics/resources', {
      params: { hours },
    });
    return response.data;
  },

  getOverviewStats: async (): Promise<OverviewDayPoint[]> => {
    if (isDemo()) {
      return MOCK_OVERVIEW_DATA;
    }
    const response = await httpClient.get<OverviewDayPoint[]>('/analytics/overview');
    return response.data;
  },

  getFinesStats: async (hours: number = 24): Promise<FinesStats> => {
    if (isDemo()) {
      return getMockFinesStats();
    }
    const response = await httpClient.get<FinesStats>('/analytics/fines', {
      params: { hours },
    });
    return response.data;
  },
};
