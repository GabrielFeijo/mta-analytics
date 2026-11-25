import { httpClient } from './http-client';
import { useAuthStore } from '@/stores/auth-store';
import { MOCK_OPERATORS } from '@/mocks/telemetry-snapshot';
import { AuthUser, LoginResponse, OperatorRecord, UserRole } from '@/types/telemetry';

function isDemo(): boolean {
  return useAuthStore.getState().isDemoMode;
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await httpClient.post<LoginResponse>('/auth/login', { email, password });
    return response.data;
  },

  register: async (username: string, email: string, password: string): Promise<AuthUser> => {
    const response = await httpClient.post<AuthUser>('/auth/register', {
      username,
      email,
      password,
    });
    return response.data;
  },

  me: async (): Promise<AuthUser> => {
    const response = await httpClient.get<AuthUser>('/auth/me');
    return response.data;
  },

  listOperators: async (): Promise<OperatorRecord[]> => {
    if (isDemo()) {
      return MOCK_OPERATORS;
    }
    const response = await httpClient.get<OperatorRecord[]>('/auth/operators');
    return response.data;
  },

  createOperator: async (payload: {
    username: string;
    email: string;
    password: string;
    role: UserRole;
  }): Promise<OperatorRecord> => {
    if (isDemo()) {
      return {
        id: Date.now(),
        username: payload.username,
        email: payload.email,
        role: payload.role,
        createdAt: new Date().toISOString(),
      };
    }
    const response = await httpClient.post<OperatorRecord>('/auth/operators', payload);
    return response.data;
  },

  updateOperatorRole: async (id: number, role: UserRole): Promise<OperatorRecord> => {
    if (isDemo()) {
      const target = MOCK_OPERATORS.find((op) => op.id === id) || MOCK_OPERATORS[0];
      return { ...target, role };
    }
    const response = await httpClient.patch<OperatorRecord>(`/auth/operators/${id}/role`, {
      role,
    });
    return response.data;
  },

  deleteOperator: async (id: number): Promise<void> => {
    if (isDemo()) {
      return;
    }
    await httpClient.delete(`/auth/operators/${id}`);
  },

  logout: async (): Promise<void> => {
    const { isDemoMode, token, logout } = useAuthStore.getState();
    try {
      if (!isDemoMode && token) {
        await httpClient.post('/auth/logout');
      }
    } catch {
      // Clear local session even if backend revocation fails
    } finally {
      logout();
    }
  },
};
