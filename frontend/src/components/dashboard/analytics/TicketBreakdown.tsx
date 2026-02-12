'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '@/lib/api/endpoints/analytics';

interface TicketBreakdownData {
  ticket_type: string;
  quantity_sold: number;
  revenue: number;
}

interface TicketBreakdownProps {
  eventId?: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function TicketBreakdown({ eventId }: TicketBreakdownProps) {
  const {
    data: eventData,
    isLoading: eventLoading,
  } = useQuery({
    queryKey: ['event-analytics', eventId],
    queryFn: () => analyticsAPI.getEventAnalytics(eventId!),
    enabled: !!eventId,
  });

  const {
    data: aggregateData,
    isLoading: aggregateLoading,
  } = useQuery({
    queryKey: ['aggregate-ticket-breakdown'],
    queryFn: analyticsAPI.getAggregateTicketBreakdown,
    enabled: !eventId,
  });

  const isLoading = eventId ? eventLoading : aggregateLoading;

  if (isLoading) {
    return <div className="h-[400px] flex items-center justify-center text-muted-foreground">Loading chart...</div>;
  }

  let chartData: TicketBreakdownData[] = [];

  if (eventId && eventData?.ticket_type_breakdown) {
    chartData = eventData.ticket_type_breakdown;
  } else if (!eventId && Array.isArray(aggregateData)) {
    chartData = aggregateData;
  }

  if (chartData.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground">
        No ticket data available yet
      </div>
    );
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
          {chartData.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => {
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
