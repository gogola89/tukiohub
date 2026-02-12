import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

// Log API URL on startup (client-side only)
if (typeof window !== 'undefined') {
  console.log('[API Client] Initialized with baseURL:', API_URL);
}

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helpers to get auth stores (avoiding circular dependency)
let getAuthStore: any = null;
let getAttendeeAuthStore: any = null;

export const setAuthStoreGetter = (getter: any) => {
  getAuthStore = getter;
};

export const setAttendeeAuthStoreGetter = (getter: any) => {
  getAttendeeAuthStore = getter;
};

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Try attendee token first, then fallback to organizer token
    let token = null;

    if (getAttendeeAuthStore) {
      token = getAttendeeAuthStore().accessToken;
    }

    if (!token && getAuthStore) {
      token = getAuthStore().accessToken;
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // If sending FormData, remove Content-Type header to let browser set it with boundary
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }

    // Log request details
    if (typeof window !== 'undefined') {
      console.log('[API Request]', config.method?.toUpperCase(), config.url);
      if (config.data) {
        console.log('[API Request Data]', config.data);
      }
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses
    if (typeof window !== 'undefined') {
      console.log('[API Response]', response.status, response.config.url);
    }
    return response;
  },
  async (error: AxiosError) => {
    // Log error responses
    if (typeof window !== 'undefined') {
      console.log('[API Error Response]', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        data: error.response?.data,
      });
    }
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retrying, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try attendee refresh first, then organizer
        let refreshToken = null;
        let refreshEndpoint = '';
        let authStore: any = null;

        if (getAttendeeAuthStore) {
          const attendeeStore = getAttendeeAuthStore();
          refreshToken = attendeeStore.refreshToken;
          if (refreshToken) {
            refreshEndpoint = '/auth/refresh/';
            authStore = attendeeStore;
          }
        }

        if (!refreshToken && getAuthStore) {
          const organizerStore = getAuthStore();
          refreshToken = organizerStore.refreshToken;
          if (refreshToken) {
            refreshEndpoint = '/auth/refresh/';
            authStore = organizerStore;
          }
        }

        if (refreshToken && authStore) {
          const response = await axios.post(`${API_URL}${refreshEndpoint}`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          authStore.setTokens(access, refreshToken);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user and redirect to home
        if (getAttendeeAuthStore) {
          const attendeeStore = getAttendeeAuthStore();
          if (attendeeStore.refreshToken) {
            attendeeStore.logout();
            if (typeof window !== 'undefined') {
              window.location.href = '/';
            }
            return Promise.reject(refreshError);
          }
        }

        if (getAuthStore) {
          const organizerStore = getAuthStore();
          if (organizerStore.refreshToken) {
            organizerStore.logout();
            if (typeof window !== 'undefined') {
              window.location.href = '/';
            }
          }
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
