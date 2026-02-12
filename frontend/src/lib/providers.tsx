'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { setAuthStoreGetter, setAttendeeAuthStoreGetter } from './api/client';
import { useAuthStore } from './store/authStore';
import { useAttendeeAuthStore } from './store/attendeeAuthStore';

export function Providers({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  // Handle hydration for Zustand persist stores
  useEffect(() => {
    setIsHydrated(true);
    setAuthStoreGetter(useAuthStore.getState);
    setAttendeeAuthStoreGetter(useAttendeeAuthStore.getState);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {isHydrated ? children : <div className="min-h-screen" />}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}
