'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '@/lib/api/endpoints/analytics';

interface SalesData {
  date: string;
  bookings: number;
  revenue: number;
}

interface SalesTimelineProps {
  eventId?: string; // Optional event ID for event-specific analytics
}

export function SalesTimeline({ eventId }: SalesTimelineProps) {
  const {
    data: eventData,
    isLoading: eventLoading,
    error: eventError
  } = useQuery({
    queryKey: ['event-sales-timeline', eventId],
    queryFn: () => analyticsAPI.getEventSalesTimeline(eventId!),
    enabled: !!eventId, // Only run if eventId is provided
  });

  // For dashboard (no eventId), we'll use mock data until we have a proper endpoint
  if (!eventId) {
    const mockData: SalesData[] = [
      { date: '2024-01-01', bookings: 4, revenue: 4000 },
      { date: '2024-01-02', bookings: 3, revenue: 3000 },
      { date: '2024-01-03', bookings: 2, revenue: 2000 },
      { date: '2024-01-04', bookings: 2, revenue: 2780 },
      { date: '2024-01-05', bookings: 1, revenue: 1890 },
      { date: '2024-01-06', bookings: 2, revenue: 2390 },
      { date: '2024-01-07', bookings: 3, revenue: 3490 },
    ];

    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={mockData}
          margin={{
            top: 10,
            right: 30,
            left: 20,
            bottom: 5,
          }}
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

  const isLoading = eventLoading;

  if (isLoading) {
    return <div className="h-80 flex items-center justify-center">Loading chart...</div>;
  }

  // The API response structure might be different than expected
  // Based on the EventAnalytics interface, sales_timeline is in the overview endpoint
  // But the sales-timeline endpoint might return the array directly or in a different structure
  let chartData: SalesData[] = [];

  if (eventData) {
    // Check if eventData is already an array (direct from sales-timeline endpoint)
    if (Array.isArray(eventData)) {
      chartData = eventData;
    } else if (eventData.sales_timeline) {
      // If it's an object with sales_timeline property (from overview endpoint)
      chartData = eventData.sales_timeline;
    } else {
      // Fallback to empty array
      chartData = [];
    }
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart
        data={chartData}
        margin={{
          top: 10,
          right: 30,
          left: 20,
          bottom: 5,
        }}
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