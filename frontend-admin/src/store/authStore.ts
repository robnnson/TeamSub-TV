import { create } from 'zustand';
import { api } from '../lib/api';
import type { LoginCredentials } from '../types';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: api.isAuthenticated(),
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      await api.login(credentials);
      set({ isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      set({ isLoading: false, error: message, isAuthenticated: false });
      throw error;
    }
  },

  logout: () => {
    api.logout();
    set({ isAuthenticated: false });
  },

  checkAuth: () => {
    set({ isAuthenticated: api.isAuthenticated() });
  },
}));
