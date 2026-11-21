import { httpClient } from './http-client';
import { useAuthStore } from '@/stores/auth-store';
import { AuthUser, LoginResponse } from '@/types/telemetry';

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
