'use client';

import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import DashboardStats from '@/components/dashboard/DashboardStats';

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.first_name}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your events today.
        </p>
      </div>

      {/* Quick Stats */}
      <DashboardStats />

      {/* Getting Started */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Get Started</CardTitle>
          <CardDescription>
            Create your first event and start selling tickets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <h3 className="font-semibold">Create your first event</h3>
              <p className="text-sm text-muted-foreground">
                Set up event details, tickets, and pricing
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/events/create">Create Event</Link>
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <h3 className="font-semibold">Complete your profile</h3>
              <p className="text-sm text-muted-foreground">
                Add company information and upload your logo
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard/profile">Edit Profile</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
