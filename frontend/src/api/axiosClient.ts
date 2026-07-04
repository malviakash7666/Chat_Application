import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { config } from '../constants/config';
import { storage } from '../utils/storage';

// Auth failure listener callback system
let authFailureListener: (() => void) | null = null;

export const setAuthFailureListener = (callback: () => void) => {
  authFailureListener = callback;
};

const axiosClient = axios.create({
  baseURL: config.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
    'ngrok-skip-browser-warning': 'true'
  }
});

// Request interceptor to automatically attach authorization header
axiosClient.interceptors.request.use(
  async (requestConfig: InternalAxiosRequestConfig) => {
    const token = await storage.getAccessToken();
    if (token && requestConfig.headers) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    return requestConfig;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to handle token expiry (401) and retry logic
axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (!error.response || !originalRequest) {
      return Promise.reject(error);
    }

    // Handle token expiry (401 Unauthorized)
    if (error.response.status === 401 && !originalRequest._retry) {
      // If it's an authentication endpoint (login, register, refresh),
      // we shouldn't attempt token refresh. Just pass the error through.
      const isAuthEndpoint = originalRequest.url && (
        originalRequest.url.includes('/api/users/login') ||
        originalRequest.url.includes('/api/users/register') ||
        originalRequest.url.includes('/api/users/refresh-token')
      );

      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // Check if we have a refresh token first before setting isRefreshing = true
      const refreshToken = await storage.getRefreshToken();
      if (!refreshToken) {
        // If there's no refresh token, we can't refresh. Just reject with the original 401 error.
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Direct axios post call to avoid recursion in client interceptor
        const response = await axios.post(`${config.BASE_URL}/api/users/refresh-token`, {
          refreshToken
        });

        if (response.data && response.data.success) {
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
          
          await storage.setTokens(newAccessToken, newRefreshToken);
          processQueue(null, newAccessToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosClient(originalRequest);
        } else {
          throw new Error('Refresh token rotation failed');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Clear local credentials on authentication failure
        await storage.clearTokens();
        await storage.clearUser();

        // Notify the app of the auth failure (e.g. to log out/redirect)
        if (authFailureListener) {
          authFailureListener();
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
