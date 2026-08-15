'use client';

import { Event } from '@/types/event';
import { format } from 'date-fns';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableSkeleton } from '@/components/ui/skeleton';
import { MoreHorizontal, Edit, Eye, Trash, Send, XCircle, LayoutGrid } from 'lucide-react';
import { eventsAPI } from '@/lib/api/endpoints/events';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

interface EventListTableProps {
  events: Event[];
  isLoading?: boolean;
}

const statusColors = {
  DRAFT: 'bg-gray-500',
  PUBLISHED: 'bg-green-500',
  CANCELLED: 'bg-red-500',
  COMPLETED: 'bg-blue-500',
};

export default function EventListTable({ events, isLoading }: EventListTableProps) {
  const queryClient = useQueryClient();

  const publishMutation = useMutation({
    mutationFn: (eventId: string) => eventsAPI.publishEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-events'] });
      toast.success('Event published successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to publish event');
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: (eventId: string) => eventsAPI.unpublishEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-events'] });
      toast.success('Event unpublished successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to unpublish event');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (eventId: string) => eventsAPI.deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-events'] });
      toast.success('Event deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete event');
    },
  });

  const handlePublish = (eventId: string) => {
    if (confirm('Are you sure you want to publish this event? It will be visible to the public.')) {
      publishMutation.mutate(eventId);
    }
  };

  const handleUnpublish = (eventId: string) => {
    if (confirm('Are you sure you want to unpublish this event? It will no longer be visible to the public.')) {
      unpublishMutation.mutate(eventId);
    }
  };

  const handleDelete = (eventId: string) => {
    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      deleteMutation.mutate(eventId);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tickets Sold</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableSkeleton rows={5} />
          </TableBody>
        </Table>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <h3 className="text-lg font-semibold mb-2">No events yet</h3>
        <p className="text-muted-foreground mb-4">
          Create your first event to start selling tickets
        </p>
        <Button asChild>
          <Link href="/dashboard/events/create">Create Event</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tickets Sold</TableHead>
            <TableHead>Revenue</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{event.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {event.venue_name}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {format(new Date(event.start_datetime), 'PPP')}
              </TableCell>
              <TableCell>
                <Badge className={statusColors[event.status]}>
                  {event.status}
                </Badge>
              </TableCell>
              <TableCell>{event.tickets_sold || 0}</TableCell>
              <TableCell>KES {(event.revenue || 0).toLocaleString()}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/events/${event.slug}`} target="_blank">
                        <Eye className="mr-2 h-4 w-4" />
                        View Public Page
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/analytics?event=${event.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Analytics
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/events/${event.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Event
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/events/${event.id}/desk`}>
                        <LayoutGrid className="mr-2 h-4 w-4" />
                        Registration Desk
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {event.status === 'DRAFT' ? (
                      <DropdownMenuItem onClick={() => handlePublish(event.id)}>
                        <Send className="mr-2 h-4 w-4" />
                        Publish Event
                      </DropdownMenuItem>
                    ) : event.status === 'PUBLISHED' ? (
                      <DropdownMenuItem onClick={() => handleUnpublish(event.id)}>
                        <XCircle className="mr-2 h-4 w-4" />
                        Unpublish Event
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(event.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete Event
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
