'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI, EventAnalytics } from '@/lib/api/endpoints/analytics';

interface TicketBreakdownData {
  ticket_type: string;
  quantity_sold: number;
  revenue: number;
}

interface TicketBreakdownProps {
  eventId?: string; // Optional event ID for event-specific analytics
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function TicketBreakdown({ eventId }: TicketBreakdownProps) {
  // Use different queries for event-specific vs dashboard analytics
  const {
    data: eventData,
    isLoading: eventLoading,
    error: eventError
  } = useQuery({
    queryKey: ['event-analytics', eventId],
    queryFn: () => analyticsAPI.getEventAnalytics(eventId!),
    enabled: !!eventId, // Only run if eventId is provided
  });

  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: analyticsAPI.getQuickStats,
    enabled: !eventId, // Only run if no eventId is provided
  });

  // Mock data for now - will be replaced with real API data
  const mockData: TicketBreakdownData[] = [
    { ticket_type: 'VIP', quantity_sold: 400, revenue: 40000 },
    { ticket_type: 'Regular', quantity_sold: 300, revenue: 15000 },
    { ticket_type: 'Early Bird', quantity_sold: 200, revenue: 10000 },
    { ticket_type: 'Student', quantity_sold: 100, revenue: 5000 },
  ];

  // Handle loading state
  const isLoading = eventId ? eventLoading : dashboardLoading;

  if (isLoading) {
    return <div className="h-80 flex items-center justify-center">Loading chart...</div>;
  }

  // Use real data if available, otherwise use mock data
  let chartData: (TicketBreakdownData & { [key: string]: any })[] = mockData as (TicketBreakdownData & { [key: string]: any })[];

  if (eventId && eventData) {
    // If it's an event-specific request, use the event analytics data
    // Check if eventData is the full EventAnalytics object or just the breakdown
    if (Array.isArray(eventData)) {
      // If it's an array (direct from a breakdown endpoint)
      chartData = eventData as (TicketBreakdownData & { [key: string]: any })[];
    } else if (eventData.ticket_type_breakdown) {
      // If it's an EventAnalytics object with the breakdown property
      chartData = (eventData.ticket_type_breakdown || mockData) as (TicketBreakdownData & { [key: string]: any })[];
    } else {
      // Fallback to mock data
      chartData = mockData as (TicketBreakdownData & { [key: string]: any })[];
    }
  } else if (!eventId && dashboardData) {
    // For dashboard, we might need to handle differently or keep mock data
    chartData = mockData as (TicketBreakdownData & { [key: string]: any })[]; // For now, keep mock data for dashboard
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="quantity_sold"
          nameKey="ticket_type"
          label={({ name, percent }) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
        >
          {chartData.map((entry: TicketBreakdownData & { [key: string]: any }, index: number) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name, props) => {
            if (name === 'quantity_sold') {
              return [value, 'Tickets Sold'];
            }
            return [value, name];
          }}
          labelFormatter={(label) => `Ticket Type: ${label}`}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}