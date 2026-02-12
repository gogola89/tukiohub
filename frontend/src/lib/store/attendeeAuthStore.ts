import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Attendee } from '@/types/attendee';

interface AttendeeAuthState {
  attendee: Attendee | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAttendee: (attendee: Attendee) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateWalletBalance: (balance: number) => void;
}

export const useAttendeeAuthStore = create<AttendeeAuthState>()(
  persist(
    (set) => ({
      attendee: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAttendee: (attendee) => set({
        attendee,
        isAuthenticated: true
      }),

      setTokens: (accessToken, refreshToken) => set({
        accessToken,
        refreshToken
      }),

      logout: () => set({
        attendee: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      }),

      updateWalletBalance: (balance) => set((state) => ({
        attendee: state.attendee ? { ...state.attendee, wallet_balance: balance } : null,
      })),
    }),
    {
      name: 'attendee-auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
