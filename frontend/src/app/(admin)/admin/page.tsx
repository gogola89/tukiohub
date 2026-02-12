'use client';

import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '@/lib/api/endpoints/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Calendar, TrendingUp, Ticket } from 'lucide-react';

export default function AdminDashboard() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: adminAPI.getDashboardStats,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Failed to load dashboard stats. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  const statsData = [
    {
      title: 'Total Organizers',
      value: stats?.total_organizers || 0,
      description: 'Registered organizers',
      icon: Users,
    },
    {
      title: 'Pending Approvals',
      value: stats?.pending_organizers || 0,
      description: 'Awaiting verification',
      icon: Users,
    },
    {
      title: 'Total Events',
      value: stats?.total_events || 0,
      description: 'All events on platform',
      icon: Calendar,
    },
    {
      title: 'Total Revenue',
      value: `KES ${(stats?.total_revenue || 0).toLocaleString()}`,
      description: 'All-time platform revenue',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional sections can be added here */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Welcome to the admin dashboard. Here you can manage organizers, events, and view platform analytics.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}