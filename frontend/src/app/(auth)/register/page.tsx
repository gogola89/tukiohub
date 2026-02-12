import { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Users, Briefcase, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Create Account | TukioHub',
  description: 'Create your TukioHub account',
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl space-y-8">
        {/* Logo and Header */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <Link href="/" className="flex items-center space-x-2">
            <Calendar className="h-10 w-10 text-primary" />
            <span className="text-3xl font-bold">TukioHub</span>
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight">
            Join TukioHub
          </h1>
          <p className="text-muted-foreground">
            Choose how you want to get started
          </p>
        </div>

        {/* Registration Options */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Attendee Registration */}
          <Card className="relative overflow-hidden border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">I'm an Attendee</CardTitle>
              <CardDescription className="text-base">
                Looking to discover and book tickets for amazing events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Browse and book events easily</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Manage your tickets in one place</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Digital wallet for quick payments</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Get event updates and notifications</span>
                </li>
              </ul>
              <Button asChild className="w-full" size="lg">
                <Link href="/attendee/register">
                  Register as Attendee
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline">
                  Login here
                </Link>
              </p>
            </CardContent>
          </Card>

          {/* Organizer Registration */}
          <Card className="relative overflow-hidden border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <Briefcase className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-2xl">I'm an Organizer</CardTitle>
              <CardDescription className="text-base">
                Ready to create and manage professional events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Create and publish unlimited events</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Manage tickets and track sales</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Access analytics and insights</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Promo codes and add-ons</span>
                </li>
              </ul>
              <Button asChild className="w-full" size="lg">
                <Link href="/register/organizer">
                  Register as Organizer
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline">
                  Login here
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
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
