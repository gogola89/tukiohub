'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '@/lib/api/endpoints/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Ticket, TrendingUp, Users } from 'lucide-react';

const statStyles = [
  {
    gradient: 'from-[#006B3F]/10 to-[#006B3F]/5',
    iconBg: 'bg-[#006B3F]/15',
    iconColor: 'text-[#006B3F]',
    borderHover: 'hover:border-[#006B3F]/30',
  },
  {
    gradient: 'from-[#BE0027]/10 to-[#BE0027]/5',
    iconBg: 'bg-[#BE0027]/15',
    iconColor: 'text-[#BE0027]',
    borderHover: 'hover:border-[#BE0027]/30',
  },
  {
    gradient: 'from-primary/10 to-primary/5',
    iconBg: 'bg-primary/15',
    iconColor: 'text-primary',
    borderHover: 'hover:border-primary/30',
  },
  {
    gradient: 'from-accent/10 to-accent/5',
    iconBg: 'bg-accent/15',
    iconColor: 'text-accent',
    borderHover: 'hover:border-accent/30',
  },
];

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
        const style = statStyles[index];
        return (
          <Card
            key={index}
            className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${style.borderHover}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-50`} />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`p-2 rounded-xl ${style.iconBg}`}>
                <Icon className={`h-4 w-4 ${style.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
