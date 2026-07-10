import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  
  login: async (token, user) => {
    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('userData', JSON.stringify(user));
    set({ token, user });
  },
  
  logout: async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
    set({ token: null, user: null });
  },

  setUser: async (user) => {
    await AsyncStorage.setItem('userData', JSON.stringify(user));
    set({ user });
  },

  checkAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        const response = await apiClient.get('/auth/me');
        const user = response.data.data.user as User;
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        set({ token, user, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      await Promise.all([
        AsyncStorage.removeItem('userToken'),
        AsyncStorage.removeItem('userData'),
      ]);
      set({ token: null, user: null, isLoading: false });
    }
  }
}));
