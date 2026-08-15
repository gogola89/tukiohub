'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { format } from 'date-fns';
import { eventsAPI } from '@/lib/api/endpoints/events';
import { analyticsAPI } from '@/lib/api/endpoints/analytics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, Printer } from 'lucide-react';

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

export default function PostEventReportPage({ params }: ReportPageProps) {
  const { id: eventId } = use(params);

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsAPI.getEventById(eventId),
  });

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['event-analytics', eventId],
    queryFn: () => analyticsAPI.getEventAnalytics(eventId),
  });

  const { data: reconciliation, isLoading: reconciliationLoading } = useQuery({
    queryKey: ['event-reconciliation', eventId],
    queryFn: () => analyticsAPI.getReconciliationReport(eventId),
  });

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ['event-sales-timeline', eventId],
    queryFn: () => analyticsAPI.getEventSalesTimeline(eventId),
  });

  const isLoading = eventLoading || overviewLoading || reconciliationLoading || timelineLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!event || !overview) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
        <p className="text-muted-foreground">Report data not available.</p>
      </div>
    );
  }

  const activeTicketTypeBreakdown = overview.ticket_type_breakdown.filter(
    (row) => row.quantity_sold > 0
  );
  const activeTimeline = (timeline || []).filter((row) => row.bookings > 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link href={`/dashboard/events/${eventId}/edit`}>
          <Button variant="ghost" className="-ml-4">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Event
          </Button>
        </Link>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print / Save as PDF
        </Button>
      </div>

      <div className="space-y-6" id="report-content">
        <div className="text-center border-b pb-6">
          <h1 className="text-3xl font-bold">{event.title}</h1>
          <p className="text-muted-foreground mt-1">Post-Event Report</p>
          <p className="text-sm text-muted-foreground mt-1">
            {format(new Date(event.start_datetime), 'PPP')} &ndash;{' '}
            {format(new Date(event.end_datetime), 'PPP')} &middot; {event.venue_name}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Generated {format(new Date(), 'PPP p')}
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">{overview.confirmed_bookings}</p>
              <p className="text-xs text-muted-foreground uppercase">Registrations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">{overview.total_tickets}</p>
              <p className="text-xs text-muted-foreground uppercase">Tickets Sold</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">{overview.check_in_rate}%</p>
              <p className="text-xs text-muted-foreground uppercase">Check-in Rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">KES {overview.net_revenue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground uppercase">Net Revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue by ticket type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue by Ticket Type</CardTitle>
          </CardHeader>
          <CardContent>
            {activeTicketTypeBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tickets sold.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2">Ticket Type</th>
                    <th className="py-2 text-right">Quantity Sold</th>
                    <th className="py-2 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTicketTypeBreakdown.map((row) => (
                    <tr key={row.ticket_type} className="border-b last:border-0">
                      <td className="py-2">{row.ticket_type}</td>
                      <td className="py-2 text-right">{row.quantity_sold}</td>
                      <td className="py-2 text-right">KES {row.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Revenue by payment method */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue by Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            {!reconciliation || reconciliation.payments_by_method.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments recorded.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2">Method</th>
                    <th className="py-2 text-right">Count</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {reconciliation.payments_by_method.map((row) => (
                    <tr key={row.method} className="border-b last:border-0">
                      <td className="py-2">{row.method_label}</td>
                      <td className="py-2 text-right">{row.count}</td>
                      <td className="py-2 text-right">KES {row.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Daily trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily Registration Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {activeTimeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">No registration activity recorded.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2">Date</th>
                    <th className="py-2 text-right">Bookings</th>
                    <th className="py-2 text-right">Tickets</th>
                    <th className="py-2 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTimeline.map((row) => (
                    <tr key={row.date} className="border-b last:border-0">
                      <td className="py-2">{format(new Date(row.date), 'PPP')}</td>
                      <td className="py-2 text-right">{row.bookings}</td>
                      <td className="py-2 text-right">{row.tickets}</td>
                      <td className="py-2 text-right">KES {row.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Reconciliation status */}
        {reconciliation && (
          <Card className={reconciliation.reconciliation.is_clean ? 'border-green-300' : 'border-red-300'}>
            <CardHeader>
              <CardTitle className="text-lg">Reconciliation Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {reconciliation.reconciliation.is_clean
                  ? 'Clean — every confirmed registration has a matching completed payment, and vice versa.'
                  : `Needs review — ${reconciliation.reconciliation.bookings_without_transaction_count} registration(s) without a matching payment, ${reconciliation.reconciliation.transactions_without_booking_count} payment(s) without a matching registration.`}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
