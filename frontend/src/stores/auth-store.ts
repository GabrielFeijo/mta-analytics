import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { queryClient } from '@/lib/query-client';
import { useDashboardStore } from '@/stores/dashboard-store';
import { AuthUser } from '@/types/telemetry';

export const DEMO_TOKEN = 'garage-night-demo-token';

const DEMO_USER: AuthUser = {
  id: 1,
  username: 'Gabriel_Feijo',
  email: 'admin@garagenight.rp',
  role: 'ADMIN',
};

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  enterDemoMode: () => void;
  logout: () => void;
}

function resetClientTelemetryState(): void {
  queryClient.clear();
  useDashboardStore.getState().reset();
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isDemoMode: false,

      setAuth: (token, user) => {
        resetClientTelemetryState();
        set({
          token,
          user,
          isAuthenticated: true,
          isDemoMode: false,
        });
      },

      setUser: (user) => set({ user }),

      enterDemoMode: () => {
        resetClientTelemetryState();
        set({
          token: DEMO_TOKEN,
          user: DEMO_USER,
          isAuthenticated: true,
          isDemoMode: true,
        });
      },

      logout: () => {
        resetClientTelemetryState();
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isDemoMode: false,
        });
      },
    }),
    {
      name: 'auth-storage',
    },
  ),
);
