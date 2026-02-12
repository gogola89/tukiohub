import { Metadata } from 'next';
import Link from 'next/link';
import RegisterForm from '@/components/auth/RegisterForm';
import { Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Organizer Registration | TukioHub',
  description: 'Create your TukioHub organizer account',
};

export default function OrganizerRegisterPage() {
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
            Become an Organizer
          </h1>
          <p className="text-sm text-muted-foreground">
            Create your account and start hosting events
          </p>
        </div>

        {/* Register Form */}
        <div className="rounded-lg border bg-card p-8 shadow-sm">
          <RegisterForm />
        </div>

        {/* Footer Links */}
        <div className="space-y-2">
          <p className="text-center text-sm text-muted-foreground">
            Already have an organizer account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Login here
            </Link>
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Looking to attend events instead?{' '}
            <Link href="/attendee/register" className="text-primary hover:underline">
              Register as Attendee
            </Link>
          </p>
        </div>

        {/* Terms */}
        <p className="text-center text-xs text-muted-foreground">
          By creating an account, you agree to our{' '}
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
