'use client';

import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import DashboardStats from '@/components/dashboard/DashboardStats';
import { Plus, UserCog, ArrowRight, Sparkles } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="w-full px-4 py-8">
      {/* Welcome Header */}
      <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#006B3F] via-primary to-[#006B3F] p-8 text-white">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        </div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white/90 text-sm font-medium mb-3">
            <Sparkles className="w-3 h-3" />
            Dashboard
          </div>
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.first_name}!
          </h1>
          <p className="text-white/80 mt-1">
            Here's what's happening with your events today.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <DashboardStats />

      {/* Getting Started */}
      <Card className="mt-8 border-2 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Get Started
          </CardTitle>
          <CardDescription>
            Create your first event and start selling tickets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="group flex items-center justify-between rounded-xl border p-5 hover:border-primary/30 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#006B3F]/10">
                <Plus className="h-5 w-5 text-[#006B3F]" />
              </div>
              <div>
                <h3 className="font-semibold">Create your first event</h3>
                <p className="text-sm text-muted-foreground">
                  Set up event details, tickets, and pricing
                </p>
              </div>
            </div>
            <Button className="bg-gradient-to-r from-primary to-[#006B3F] hover:opacity-90 transition-opacity" asChild>
              <Link href="/dashboard/events/create">
                Create Event
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>
          </div>

          <div className="group flex items-center justify-between rounded-xl border p-5 hover:border-primary/30 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
                <UserCog className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold">Complete your profile</h3>
                <p className="text-sm text-muted-foreground">
                  Add company information and upload your logo
                </p>
              </div>
            </div>
            <Button variant="outline" className="border-2 hover:border-primary/30" asChild>
              <Link href="/dashboard/profile">
                Edit Profile
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
