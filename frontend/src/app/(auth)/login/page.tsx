'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LoginForm from '@/components/auth/LoginForm';
import { Calendar, Mail } from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <Link href="/" className="flex items-center space-x-2">
            <Calendar className="h-10 w-10 text-primary" />
            <span className="text-3xl font-bold">TukioHub</span>
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in as an organizer or attendee
          </p>
        </div>

        {/* Email Verification Notice */}
        {registered === 'true' && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 text-sm">
                  Verify your email address
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  We've sent a verification email to your inbox. Please check your email
                  and click the verification link to activate your account before logging in.
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Don't see the email? Check your spam folder.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <div className="rounded-lg border bg-card p-8 shadow-sm">
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-primary">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-primary">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg space-y-6">
          <div className="flex flex-col items-center space-y-2 text-center">
            <Calendar className="h-10 w-10 text-primary" />
            <span className="text-3xl font-bold">TukioHub</span>
          </div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
