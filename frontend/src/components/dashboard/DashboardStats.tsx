'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '@/lib/api/endpoints/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Ticket, TrendingUp, Users } from 'lucide-react';

export default function DashboardStats() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: analyticsAPI.getDashboardStats,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // If there's an error, use empty stats as fallback
  // This provides a better UX than showing an error banner
  const displayStats = error ? {
    total_events: 0,
    upcoming_events_count: 0,
    tickets_sold: 0,
    total_revenue: 0,
    total_bookings: 0,
    total_attendees: 0,
  } : stats;

  const statsData = [
    {
      title: 'Total Events',
      value: displayStats?.total_events || 0,
      description:
        displayStats?.upcoming_events_count
          ? `${displayStats.upcoming_events_count} upcoming`
          : 'No upcoming events',
      icon: Calendar,
    },
    {
      title: 'Tickets Sold',
      value: displayStats?.tickets_sold || 0,
      description: displayStats?.tickets_sold
        ? `Across all events`
        : 'No tickets sold yet',
      icon: Ticket,
    },
    {
      title: 'Total Revenue',
      value: `KES ${(displayStats?.total_revenue || 0).toLocaleString()}`,
      description: displayStats?.total_bookings
        ? `${displayStats.total_bookings} bookings`
        : 'No bookings yet',
      icon: TrendingUp,
    },
    {
      title: 'Attendees',
      value: displayStats?.total_attendees || 0,
      description: displayStats?.total_attendees
        ? 'Total attendees'
        : 'No attendees yet',
      icon: Users,
    },
  ];

  return (
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
  );
}
