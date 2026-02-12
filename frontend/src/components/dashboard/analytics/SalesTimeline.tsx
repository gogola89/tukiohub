'use client';

import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '@/lib/api/endpoints/analytics';

interface SalesData {
  date: string;
  bookings: number;
  revenue: number;
}

interface SalesTimelineProps {
  eventId?: string;
}

export function SalesTimeline({ eventId }: SalesTimelineProps) {
  const {
    data: eventTimeline,
    isLoading: eventLoading,
  } = useQuery({
    queryKey: ['event-sales-timeline', eventId],
    queryFn: () => analyticsAPI.getEventSalesTimeline(eventId!),
    enabled: !!eventId,
  });

  const {
    data: aggregateTimeline,
    isLoading: aggregateLoading,
  } = useQuery({
    queryKey: ['aggregate-sales-timeline'],
    queryFn: () => analyticsAPI.getAggregateSalesTimeline(30),
    enabled: !eventId,
  });

  const isLoading = eventId ? eventLoading : aggregateLoading;
  const rawData = eventId ? eventTimeline : aggregateTimeline;

  if (isLoading) {
    return <div className="h-[300px] flex items-center justify-center text-muted-foreground">Loading chart...</div>;
  }

  const chartData: SalesData[] = Array.isArray(rawData)
    ? rawData.map(d => ({ date: d.date, bookings: d.bookings, revenue: d.revenue }))
    : [];

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        No sales data available yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
      >
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="date" />
        <YAxis />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip
          formatter={(value, name) => {
            if (name === 'revenue') {
              return [`KES ${Number(value).toLocaleString()}`, 'Revenue'];
            }
            return [value, name === 'bookings' ? 'Bookings' : name];
          }}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Area type="monotone" dataKey="revenue" name="Revenue (KES)" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" />
        <Area type="monotone" dataKey="bookings" name="Bookings" stroke="#10b981" fillOpacity={1} fill="url(#colorBookings)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
