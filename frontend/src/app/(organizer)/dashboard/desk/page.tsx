'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { format } from 'date-fns';
import { eventsAPI } from '@/lib/api/endpoints/events';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LayoutGrid, Calendar } from 'lucide-react';

export default function DeskEventPickerPage() {
  const { data: events, isLoading } = useQuery({
    queryKey: ['my-events'],
    queryFn: eventsAPI.getMyEvents,
  });

  return (
    <div className="w-full px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Registration Desk</h1>
        <p className="text-muted-foreground">
          Choose an event to open its onsite registration desk
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {!isLoading && (!events || events.length === 0) && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            You don&apos;t have any events yet.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {events?.map((event) => {
          const isPublished = event.status === 'PUBLISHED';
          return (
            <Card key={event.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">{event.title}</CardTitle>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(event.start_datetime), 'PPP')}
                    </p>
                  </div>
                  <Badge variant={isPublished ? 'default' : 'secondary'}>
                    {event.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {isPublished ? (
                  <Link href={`/dashboard/events/${event.id}/desk`}>
                    <Button>
                      <LayoutGrid className="mr-2 h-4 w-4" />
                      Open Desk
                    </Button>
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Publish this event before registering attendees at the desk.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
