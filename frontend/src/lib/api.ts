import axios from 'axios';
import { Player, Transaction } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authApi = {
    login: async (email: string, password: string) => {
        const response = await apiClient.post('/auth/login', {
            email,
            password,
        });
        return response.data;
    },

    logout: async () => {
        await apiClient.post('/auth/logout');
        localStorage.removeItem('auth_token');
    },

    me: async () => {
        const response = await apiClient.get('/auth/me');
        return response.data;
    },

    register: async (username: string, email: string, password: string) => {
        const response = await apiClient.post('/auth/register', {
            username,
            email,
            password,
        });
        return response.data;
    },
};

export const analyticsApi = {
    getDashboardStats: async () => {
        const response = await apiClient.get('/analytics/dashboard');
        return response.data;
    },

    getHeatmapData: async (params: {
        eventType: string;
        startDate: Date;
        endDate: Date;
    }) => {
        const response = await apiClient.get('/analytics/heatmap', { params });
        return response.data;
    },

    getPlayerActivity: async (playerId: number, hours: number = 24) => {
        const response = await apiClient.get(`/analytics/players/${playerId}/activity`, {
            params: { hours },
        });
        return response.data;
    },

    getRecentEvents: async (limit: number = 50) => {
        const response = await apiClient.get('/analytics/events/recent', {
            params: { limit },
        });
        return response.data;
    },

    getResourcesStats: async (hours: number = 24) => {
        const response = await apiClient.get('/analytics/resources', {
            params: { hours },
        });
        return response.data;
    },

    getOverviewStats: async () => {
        const response = await apiClient.get('/analytics/overview');
        return response.data;
    },

    getFinesStats: async (hours: number = 24) => {
        const response = await apiClient.get('/analytics/fines', {
            params: { hours },
        });
        return response.data;
    }
};

export const playersApi = {
    getOnlinePlayers: async (): Promise<Player[]> => {
        const response = await apiClient.get('/players/online');
        return response.data;
    },

    getPlayer: async (id: number): Promise<Player> => {
        const response = await apiClient.get(`/players/${id}`);
        return response.data;
    },

    searchPlayers: async (query: string): Promise<Player[]> => {
        const response = await apiClient.get('/players/search', {
            params: { q: query },
        });
        return response.data;
    },
};

export const economyApi = {
    getSnapshot: async () => {
        const response = await apiClient.get('/economy/snapshot');
        return response.data;
    },

    getTimeSeries: async (metric: string, period: string) => {
        const response = await apiClient.get('/economy/timeseries', {
            params: { metric, period },
        });
        return response.data;
    },

    getRecentTransactions: async (limit: number = 50): Promise<Transaction[]> => {
        const response = await apiClient.get('/economy/transactions/recent', {
            params: { limit },
        });
        return response.data;
    },

    getPlayerTransactions: async (playerId: number, limit: number = 50): Promise<Transaction[]> => {
        const response = await apiClient.get(`/economy/transactions/player/${playerId}`, {
            params: { limit },
        });
        return response.data;
    },
};

export default apiClient;
