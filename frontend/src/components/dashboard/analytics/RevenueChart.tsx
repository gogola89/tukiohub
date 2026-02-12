'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '@/lib/api/endpoints/analytics';

interface RevenueData {
  date: string;
  revenue: number;
  bookings: number;
}

interface RevenueChartProps {
  eventId?: string;
}

export function RevenueChart({ eventId }: RevenueChartProps) {
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

  const chartData: RevenueData[] = Array.isArray(rawData)
    ? rawData.map(d => ({ date: d.date, revenue: d.revenue, bookings: d.bookings }))
    : [];

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        No revenue data available yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip
          formatter={(value, name) => {
            if (name === 'revenue') {
              return [`KES ${Number(value).toLocaleString()}`, 'Revenue'];
            }
            return [value, name === 'bookings' ? 'Bookings' : name];
          }}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Legend />
        <Bar dataKey="revenue" name="Revenue (KES)" fill="#3b82f6">
          {chartData.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill="#3b82f6" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
