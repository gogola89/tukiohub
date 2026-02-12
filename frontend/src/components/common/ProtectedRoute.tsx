'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('ORGANIZER' | 'ADMIN' | 'ATTENDEE')[];
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    // Check role-based access
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.push('/');
      return;
    }
  }, [isAuthenticated, user, allowedRoles, redirectTo, router]);

  // Show loading while checking auth
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check role access
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
