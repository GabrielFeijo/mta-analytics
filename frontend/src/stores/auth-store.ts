import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  enterDemoMode: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isDemoMode: false,

      setAuth: (token, user) =>
        set({
          token,
          user,
          isAuthenticated: true,
          isDemoMode: false,
        }),

      enterDemoMode: () =>
        set({
          token: DEMO_TOKEN,
          user: DEMO_USER,
          isAuthenticated: true,
          isDemoMode: true,
        }),

      logout: () => {
        localStorage.removeItem('auth_token');
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
