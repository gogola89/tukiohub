'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { analyticsAPI } from '@/lib/api/endpoints/analytics';
import { eventsAPI } from '@/lib/api/endpoints/events';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Tag, Ticket, TrendingUp } from 'lucide-react';
import DashboardStats from '@/components/dashboard/DashboardStats';
import { RevenueChart } from '@/components/dashboard/analytics/RevenueChart';
import { SalesTimeline } from '@/components/dashboard/analytics/SalesTimeline';
import { TicketBreakdown } from '@/components/dashboard/analytics/TicketBreakdown';
import { toast } from 'react-hot-toast';

export default function AnalyticsPage() {
  const searchParams = useSearchParams();
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: analyticsAPI.getDashboardStats,
  });

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['my-events'],
    queryFn: eventsAPI.getMyEvents,
  });

  // State for selected event
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined);

  // Get event-specific analytics if an event is selected
  const { data: eventAnalytics, isLoading: eventAnalyticsLoading } = useQuery({
    queryKey: ['event-analytics', selectedEventId],
    queryFn: () => analyticsAPI.getEventAnalytics(selectedEventId!),
    enabled: !!selectedEventId,
  });

  // Get specific event details when an event is selected
  const { data: selectedEventDetails, isLoading: eventDetailsLoading } = useQuery({
    queryKey: ['event-details', selectedEventId],
    queryFn: () => eventsAPI.getEventById(selectedEventId!),
    enabled: !!selectedEventId,
  });

  // Determine which data to show based on event selection
  const displayStats = selectedEventId ? eventAnalytics : stats;

  // Set the selected event from URL params on initial load
  useEffect(() => {
    const eventParam = searchParams.get('event');
    if (eventParam && events) {
      // Verify the event exists for this organizer
      const eventExists = events.some(event => event.id === eventParam);
      if (eventExists) {
        setSelectedEventId(eventParam);
      }
    }
  }, [searchParams, events]);

  if (statsLoading || eventsLoading || (selectedEventId && eventAnalyticsLoading) || (selectedEventId && eventDetailsLoading)) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <Skeleton className="w-64 h-10" />
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
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>

        {/* Event Filter Dropdown */}
        <div className="w-full md:w-auto">
          <Select
            value={selectedEventId || "all"}
            onValueChange={(value) => setSelectedEventId(value === "all" ? undefined : value)}
          >
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events?.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Stats - show different stats based on event selection */}
      {selectedEventId ? (
        // Event-specific stats
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{eventAnalytics?.tickets_sold || 0}</div>
              <p className="text-xs text-muted-foreground">
                {eventAnalytics?.total_bookings
                  ? `${eventAnalytics.total_bookings} bookings`
                  : 'For this event'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Event Date</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {selectedEventDetails?.start_datetime
                  ? new Date(selectedEventDetails.start_datetime).toLocaleDateString()
                  : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">Event date</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promo Codes</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {selectedEventDetails?.promo_codes?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Active codes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                KES {(eventAnalytics?.total_revenue || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {eventAnalytics?.capacity_used_percent
                  ? `${eventAnalytics.capacity_used_percent}% capacity used`
                  : 'Total revenue'}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        // All events stats
        <DashboardStats />
      )}

      {/* Revenue and Sales Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart eventId={selectedEventId} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesTimeline eventId={selectedEventId} />
          </CardContent>
        </Card>
      </div>

      {/* Ticket Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Ticket Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketBreakdown eventId={selectedEventId} />
        </CardContent>
      </Card>

      {/* Export Options - only show when an event is selected */}
      {selectedEventId && (
        <Card>
          <CardHeader>
            <CardTitle>Export Data</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4 flex-wrap">
            <button
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              onClick={() => handleExportAttendees(selectedEventId)}
            >
              Export Attendees (CSV)
            </button>
            <button
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              onClick={() => handleExportSales(selectedEventId)}
            >
              Export Sales Data (CSV)
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

async function handleExportAttendees(eventId: string) {
  try {
    const { analyticsAPI } = await import('@/lib/api/endpoints/analytics');
    const blob = await analyticsAPI.exportAttendees(eventId);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendees-${eventId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting attendees:', error);
    toast.error('Failed to export attendees');
  }
}

async function handleExportSales(eventId: string) {
  try {
    const { analyticsAPI } = await import('@/lib/api/endpoints/analytics');
    const blob = await analyticsAPI.exportSales(eventId);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-${eventId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting sales:', error);
    toast.error('Failed to export sales data');
  }
}