import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { authAPI, UnifiedAuthResponse } from '@/lib/api/endpoints/auth';
import { useAuthStore } from '@/lib/store/authStore';
import { useAttendeeAuthStore } from '@/lib/store/attendeeAuthStore';
import { LoginInput, RegisterInput } from '@/lib/validations/auth';
import { AuthResponse } from '@/types/user';

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, setAuth, logout: logoutStore } = useAuthStore();

  // Unified login mutation (automatically detects organizer or attendee)
  const unifiedLoginMutation = useMutation({
    mutationFn: (credentials: LoginInput) => authAPI.unifiedLogin(credentials),
    onSuccess: (data: UnifiedAuthResponse) => {
      console.log('[useAuth] Unified login successful:', { user_type: data.user_type });
      toast.success('Login successful!');

      // Route based on user type
      if (data.user_type === 'attendee') {
        // Store in attendee auth store
        console.log('[useAuth] Storing attendee data in attendee auth store');
        const { setAttendee, setTokens } = useAttendeeAuthStore.getState();
        setAttendee(data.user);
        setTokens(data.access, data.refresh);
        router.push('/');
      } else {
        // Store in organizer/admin auth store
        console.log('[useAuth] Storing user data in organizer/admin auth store');
        setAuth(data.user, data.access, data.refresh);

        // Redirect based on role
        if (data.user.role === 'ADMIN') {
          router.push('/admin');
        } else if (data.user.role === 'ORGANIZER') {
          router.push('/dashboard');
        } else {
          router.push('/');
        }
      }
    },
    onError: (error: any) => {
      console.error('[useAuth] Unified login error:', error);
      console.error('[useAuth] Error response:', error.response?.data);

      // Try to get the most specific error message
      const message =
        error.response?.data?.non_field_errors?.[0] ||
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Login failed. Please check your credentials.';

      toast.error(message);
    },
  });

  // Login mutation (organizer-specific)
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginInput) => authAPI.login(credentials),
    onSuccess: (data: AuthResponse) => {
      setAuth(data.user, data.access, data.refresh);
      toast.success('Login successful!');

      // Redirect based on role
      if (data.user.role === 'ADMIN') {
        router.push('/admin');
      } else if (data.user.role === 'ORGANIZER') {
        router.push('/dashboard');
      } else {
        router.push('/');
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Login failed. Please check your credentials.';
      toast.error(message);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: RegisterInput) => authAPI.register(data),
    onSuccess: (data: AuthResponse) => {
      // Don't auto-login - require email verification first
      toast.success('Registration successful! Please check your email to verify your account.');
      router.push('/login?registered=true');
    },
    onError: (error: any) => {
      const errors = error.response?.data;
      if (errors?.email) {
        toast.error(errors.email[0]);
      } else if (errors?.phone_number) {
        toast.error(errors.phone_number[0]);
      } else {
        toast.error('Registration failed. Please try again.');
      }
    },
  });

  // Get user profile query
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: authAPI.getProfile,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Sync Zustand store with fresh profile data from API
  useEffect(() => {
    if (profile && isAuthenticated) {
      useAuthStore.getState().setUser(profile);
    }
  }, [profile, isAuthenticated]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<AuthResponse['user']>) => authAPI.updateProfile(data),
    onSuccess: (updatedUser) => {
      useAuthStore.getState().setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success('Profile updated successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to update profile.';
      toast.error(message);
    },
  });

  // Logout function
  const logout = async () => {
    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logoutStore();
      queryClient.clear();
      toast.success('Logged out successfully');
      router.push('/');
    }
  };

  return {
    user,
    isAuthenticated,
    profile,
    isLoadingProfile,
    unifiedLogin: unifiedLoginMutation.mutate,
    isUnifiedLoggingIn: unifiedLoginMutation.isPending,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    updateProfile: updateProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isPending,
    logout,
  };
}
