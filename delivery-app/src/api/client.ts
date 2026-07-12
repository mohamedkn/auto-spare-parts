import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getAuthToken } from '../lib/auth-token-storage';

// Dynamically determine the local IP for the API URL based on Expo's hostUri
// This ensures that testing on a physical device over Wi-Fi connects to the correct local server (Next.js)
export const getBaseUrl = () => {
  const configuredUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
  if (configuredUrl) {
    if (!__DEV__ && !configuredUrl.startsWith('https://')) throw new Error('Production API URL must use HTTPS');
    return configuredUrl;
  }

  if (__DEV__ && Constants.expoConfig?.hostUri) {
    const host = Constants.expoConfig.hostUri.split(`:`)[0];
    return `http://${host}:3000`;
  }
  if (!__DEV__) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL is required in production builds');
  }

  if (Platform.OS === 'web') return 'http://localhost:3000';
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
};

const API_URL = `${getBaseUrl()}/api`;

export const formatImageUrl = (url: string | undefined | null) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `${getBaseUrl()}${url}`;
  return `${getBaseUrl()}/${url}`;
};

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 12_000,
});

// Add interceptor to attach token to requests
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
