'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api/endpoints/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, Calendar } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  // Use a ref to prevent duplicate API calls (React StrictMode runs effects twice)
  const hasVerified = useRef(false);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Verification token is missing');
        return;
      }

      // Prevent duplicate verification attempts
      if (hasVerified.current) {
        return;
      }
      hasVerified.current = true;

      try {
        await authAPI.verifyEmail(token);
        setStatus('success');
        setMessage('Your email has been verified successfully!');

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } catch (error: any) {
        const errorMessage = error?.response?.data?.detail
          || error?.response?.data?.message
          || '';

        // If the error is about already being verified, show appropriate message
        if (errorMessage.toLowerCase().includes('already') ||
            errorMessage.toLowerCase().includes('verified')) {
          setStatus('success');
          setMessage('This email has already been verified. You can now login.');

          setTimeout(() => {
            router.push('/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(errorMessage || 'Email verification failed. The token may be invalid or expired.');
        }
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <Link href="/" className="flex items-center space-x-2">
            <Calendar className="h-10 w-10 text-primary" />
            <span className="text-3xl font-bold">TukioHub</span>
          </Link>
        </div>

        {/* Verification Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Email Verification</CardTitle>
            <CardDescription className="text-center">
              {status === 'loading' && 'Verifying your email address...'}
              {status === 'success' && 'Verification complete'}
              {status === 'error' && 'Verification failed'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Icon */}
            <div className="flex justify-center">
              {status === 'loading' && (
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
              )}
              {status === 'success' && (
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              )}
              {status === 'error' && (
                <XCircle className="h-16 w-16 text-red-600" />
              )}
            </div>

            {/* Status Message */}
            <div className="text-center">
              <p className={`text-sm ${
                status === 'success' ? 'text-green-600' :
                status === 'error' ? 'text-red-600' :
                'text-muted-foreground'
              }`}>
                {message}
              </p>
            </div>

            {/* Actions */}
            {status === 'success' && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 text-center">
                    Redirecting to login page in a few seconds...
                  </p>
                </div>
                <Button asChild className="w-full">
                  <Link href="/login">Continue to Login</Link>
                </Button>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800 text-center">
                    Please try requesting a new verification email or contact support.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" asChild>
                    <Link href="/register">Register Again</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/login">Go to Login</Link>
                  </Button>
                </div>
              </div>
            )}

            {status === 'loading' && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Please wait while we verify your email address
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back to Home Link */}
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary hover:underline">
            Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
