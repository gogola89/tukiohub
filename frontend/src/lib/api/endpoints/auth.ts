import apiClient from '../client';
import { User, LoginCredentials, RegisterData, AuthResponse } from '@/types/user';
import { AttendeeAuthResponse } from '@/types/attendee';

// Unified auth response that can be either organizer or attendee
export type UnifiedAuthResponse =
  | (AuthResponse & { user_type: 'organizer' | 'admin' })
  | (AttendeeAuthResponse & { user_type: 'attendee' });

export const authAPI = {
  // Unified login - tries organizer endpoint first, then attendee endpoint
  unifiedLogin: async (credentials: LoginCredentials): Promise<UnifiedAuthResponse> => {
    try {
      // Try organizer login first
      console.log('[authAPI] Attempting organizer login at /auth/login/');
      const response = await apiClient.post('/auth/login/', credentials);
      console.log('[authAPI] Organizer login successful');
      return {
        ...response.data,
        user_type: response.data.user.role === 'ADMIN' ? 'admin' : 'organizer',
      };
    } catch (organizerError: any) {
      console.log('[authAPI] Organizer login failed, trying attendee login at /attendees/login/');

      // If organizer login fails, try attendee login
      try {
        const response = await apiClient.post('/attendees/login/', credentials);
        console.log('[authAPI] Attendee login successful');

        // Backend returns "attendee" field, but we need to normalize it to "user" for the frontend
        return {
          user: response.data.attendee,
          access: response.data.access,
          refresh: response.data.refresh,
          user_type: 'attendee',
        };
      } catch (attendeeError: any) {
        console.error('[authAPI] Both login attempts failed');
        // Throw the original organizer error if both fail
        throw organizerError;
      }
    }
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login/', credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register/', data);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me/');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.put('/auth/me/', data);
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await apiClient.post('/auth/refresh/', {
      refresh: refreshToken,
    });
    return response.data;
  },

  logout: async (refreshToken: string) => {
    const response = await apiClient.post('/auth/logout/', {
      refresh: refreshToken,
    });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/auth/forgot-password/', { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string, password2: string) => {
    const response = await apiClient.post('/auth/reset-password/', {
      token,
      password,
      password2,
    });
    return response.data;
  },

  verifyEmail: async (token: string) => {
    const response = await apiClient.post('/auth/verify-email/', { token });
    return response.data;
  },

  uploadLogo: async (file: File) => {
    const formData = new FormData();
    formData.append('profile_image', file);
    const response = await apiClient.post('/auth/upload-logo/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
