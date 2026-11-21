import axios from 'axios';
import { useAuthStore } from '@/stores/auth-store';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 6000,
  headers: {
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const { isDemoMode, logout } = useAuthStore.getState();
    if (error.response?.status === 401 && !isDemoMode) {
      logout();
    }
    return Promise.reject(error);
  },
);
