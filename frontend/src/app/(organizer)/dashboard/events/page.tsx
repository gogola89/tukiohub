'use client';

import { useQuery } from '@tanstack/react-query';
import { eventsAPI } from '@/lib/api/endpoints/events';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Plus, Calendar, AlertCircle, Clock, XCircle } from 'lucide-react';
import EventListTable from '@/components/dashboard/events/EventListTable';
import { useAuthStore } from '@/lib/store/authStore';

export default function EventsPage() {
  const { user } = useAuthStore();
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['my-events'],
    queryFn: eventsAPI.getMyEvents,
  });

  const isApproved = user?.verification_status === 'APPROVED';
  const isPending = user?.verification_status === 'PENDING';
  const isRejected = user?.verification_status === 'REJECTED';

  return (
    <div className="w-full px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Events</h1>
          <p className="text-muted-foreground">
            Manage all your events in one place
          </p>
        </div>
        {isApproved && (
          <Button asChild>
            <Link href="/dashboard/events/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Link>
          </Button>
        )}
      </div>

      {/* Approval Status Messages */}
      {isPending && (
        <Alert className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-950">
          <Clock className="h-5 w-5 text-orange-600" />
          <AlertTitle className="text-orange-900 dark:text-orange-100">Approval Pending</AlertTitle>
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            Your organizer account is currently under review. You will be able to create events once an administrator approves your account.
            This typically takes 1-2 business days. You will receive an email notification once your account is approved.
          </AlertDescription>
        </Alert>
      )}

      {isRejected && (
        <Alert className="mb-6 border-red-200 bg-red-50 dark:bg-red-950">
          <XCircle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-900 dark:text-red-100">Account Not Approved</AlertTitle>
          <AlertDescription className="text-red-800 dark:text-red-200">
            Unfortunately, your organizer account application was not approved.
            If you believe this is an error or would like to discuss this decision, please contact our support team at support@tukiohub.com.
          </AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Failed to load events. Please try again later.
          </p>
        </div>
      )}

      {events && Array.isArray(events) && events.length > 0 && (
        <EventListTable events={events} />
      )}

      {events && Array.isArray(events) && events.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Calendar className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No events yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            You haven't created any events yet. Start by creating your first event to begin managing ticket sales and attendees.
          </p>
          <Button asChild size="lg">
            <Link href="/dashboard/events/create">
              <Plus className="mr-2 h-5 w-5" />
              Create Your First Event
            </Link>
          </Button>
        </div>
      )}

      {events && !Array.isArray(events) && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Unexpected data format received. Please contact support.
          </p>
        </div>
      )}
    </div>
  );
}
