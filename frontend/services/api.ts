import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function getApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl;
  }

  // If running in Expo Go or dev client on a physical phone or simulator
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000/api/v1`;
  }

  // Android Emulator fallback when not through hostUri
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api/v1';
  }

  // Web / iOS Simulator / default
  return envUrl || 'http://localhost:3000/api/v1';
}

export function getSocketUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_SOCKET_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  return envUrl || 'http://localhost:3000';
}

export const API_BASE_URL = getApiBaseUrl();

export const TOKEN_KEY = 'ftafat_access_token';
export const REFRESH_TOKEN_KEY = 'ftafat_refresh_token';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Helper functions for secure token storage
export async function getAccessToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function saveAuthTokens(accessToken: string, refreshToken: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  } catch (e) {
    console.warn('Could not save auth tokens:', e);
  }
}

export async function clearAuthTokens(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch (e) {
    console.warn('Could not clear auth tokens:', e);
  }
}

// Request Interceptor: Attach Access Token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Dynamically ensure base URL is current
    if (!config.baseURL || config.baseURL.includes('localhost')) {
      config.baseURL = getApiBaseUrl();
    }
    const token = await getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Refresh on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh-token')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const currentRefreshToken = await getRefreshToken();
        if (!currentRefreshToken) {
          await clearAuthTokens();
          processQueue(error as any);
          return Promise.reject(error);
        }

        const refreshResponse = await axios.post(`${getApiBaseUrl()}/auth/refresh`, {
          refreshToken: currentRefreshToken,
        });

        const tokensData = refreshResponse.data?.data;
        const newAccessToken = tokensData?.accessToken || tokensData?.tokens?.accessToken;
        const newRefreshToken = tokensData?.refreshToken || tokensData?.tokens?.refreshToken || currentRefreshToken;

        if (newAccessToken) {
          await saveAuthTokens(newAccessToken, newRefreshToken);
        }

        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error);
        await clearAuthTokens();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
