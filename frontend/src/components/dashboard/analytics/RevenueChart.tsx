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
  eventId?: string; // Optional event ID for event-specific analytics
}

export function RevenueChart({ eventId }: RevenueChartProps) {
  const {
    data: eventData,
    isLoading: eventLoading,
    error: eventError
  } = useQuery({
    queryKey: ['event-sales-timeline', eventId],
    queryFn: () => analyticsAPI.getEventSalesTimeline(eventId!),
    enabled: !!eventId, // Only run if eventId is provided
  });

  // For dashboard (no eventId), we might need a different endpoint
  // For now, we'll skip rendering if no eventId is provided
  if (!eventId) {
    // For dashboard view, we might need a different endpoint
    // For now, return a placeholder or use mock data
    const mockData: RevenueData[] = [
      { date: 'Jan', revenue: 4000, bookings: 24 },
      { date: 'Feb', revenue: 3000, bookings: 13 },
      { date: 'Mar', revenue: 2000, bookings: 8 },
      { date: 'Apr', revenue: 2780, bookings: 11 },
      { date: 'May', revenue: 1890, bookings: 7 },
      { date: 'Jun', revenue: 2390, bookings: 15 },
      { date: 'Jul', revenue: 3490, bookings: 22 },
      { date: 'Aug', revenue: 4000, bookings: 24 },
      { date: 'Sep', revenue: 3000, bookings: 13 },
      { date: 'Oct', revenue: 2000, bookings: 8 },
      { date: 'Nov', revenue: 2780, bookings: 11 },
      { date: 'Dec', revenue: 1890, bookings: 7 },
    ];

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={mockData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
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
            {mockData.map((entry: RevenueData, index: number) => (
              <Cell key={`cell-${index}`} fill="#3b82f6" />
            ))}
          </Bar>
        </BarChart>
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
  let chartData: RevenueData[] = [];

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
      <BarChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
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
          {chartData.map((entry: RevenueData, index: number) => (
            <Cell key={`cell-${index}`} fill="#3b82f6" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}