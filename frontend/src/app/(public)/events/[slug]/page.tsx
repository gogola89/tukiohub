'use client';

import { use } from 'react';
import { useEventBySlug } from '@/lib/hooks/useEvents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Share2,
  ExternalLink,
  Building2,
} from 'lucide-react';
import { formatDateKE, formatDateTimeKE, formatTimeKE } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function EventDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const { data: event, isLoading, error } = useEventBySlug(slug);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryLabel = (category?: string) => {
    if (!category) return 'Event';
    return category.charAt(0) + category.slice(1).toLowerCase().replace('_', ' ');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Date TBA';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date TBA';
      return formatDateTimeKE(date);
    } catch {
      return 'Date TBA';
    }
  };

  const handleShare = () => {
    if (navigator.share && event) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64 md:col-span-2" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Event Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The event you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild>
          <Link href="/events">Browse Events</Link>
        </Button>
      </div>
    );
  }

  // Use is_sold_out from API if available, otherwise calculate
  const isSoldOut = event.is_sold_out ?? false;
  const availableSeats = event.available_tickets ?? (event.capacity ? event.capacity - event.tickets_sold : 0);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Event Image */}
      <div className="relative aspect-video md:aspect-[21/9] overflow-hidden rounded-lg mb-6 bg-muted">
        {event.image ? (
          <Image
            src={event.image}
            alt={event.title}
            fill
            className="object-contain"
            priority
            sizes="(max-width: 1200px) 100vw, 1200px"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <div className="text-center">
              <Calendar className="w-24 h-24 mx-auto mb-4 text-primary/40" />
              <h3 className="text-2xl font-semibold text-muted-foreground">{getCategoryLabel(event.category)} Event</h3>
            </div>
          </div>
        )}
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {getCategoryLabel(event.category)}
          </Badge>
        </div>
        {isSoldOut && (
          <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full font-semibold">
            Sold Out
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Title and Basic Info */}
          <div>
            <h1 className="text-4xl font-bold mb-4">{event.title}</h1>

            <div className="flex flex-wrap gap-4 text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                <span>{formatDate(event.start_datetime, 'EEEE, MMMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                <span>
                  {formatDate(event.start_datetime, 'h:mm a')} -{' '}
                  {formatDate(event.end_datetime, 'h:mm a')}
                </span>
              </div>
            </div>

            <div className="flex items-center mt-2 text-muted-foreground">
              {event.is_online ? (
                <>
                  <ExternalLink className="w-5 h-5 mr-2" />
                  <span className="text-blue-600 font-medium">Online Event</span>
                </>
              ) : (
                <>
                  <MapPin className="w-5 h-5 mr-2" />
                  <span>
                    {event.venue_name}, {event.venue_address}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center mt-2 text-muted-foreground">
              <Users className="w-5 h-5 mr-2" />
              <span>
                {event.available_tickets !== undefined && event.available_tickets !== null
                  ? `${event.available_tickets} tickets available`
                  : `${event.tickets_sold || 0} / ${event.capacity || 0} attendees`}
              </span>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h2 className="text-2xl font-bold mb-4">About This Event</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
          </div>

          {/* Organizer Info */}
          {event.organizer && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Organized By
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  {event.organizer.profile_image ? (
                    <Image
                      src={event.organizer.profile_image}
                      alt={event.organizer.company_name}
                      width={60}
                      height={60}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-15 h-15 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-semibold text-primary">
                      {event.organizer.company_name?.charAt(0) || 'O'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">{event.organizer.company_name}</h3>
                    <p className="text-sm text-muted-foreground">Event Organizer</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Booking Card */}
        <div className="md:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Get Your Tickets</CardTitle>
              <CardDescription>
                {isSoldOut ? 'This event is sold out' : `${availableSeats} tickets remaining`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Price Range */}
              <div>
                {event.min_price !== undefined && event.min_price !== null ? (
                  <div className="text-3xl font-bold text-primary">
                    {event.min_price === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      <>
                        {event.min_price === event.max_price ? (
                          formatCurrency(event.min_price)
                        ) : (
                          <>
                            {formatCurrency(event.min_price)} - {formatCurrency(event.max_price!)}
                          </>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-lg text-muted-foreground">Price TBA</div>
                )}
              </div>

              {/* Ticket Types */}
              {event.ticket_types && event.ticket_types.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Ticket Types:</h4>
                  {event.ticket_types.map((ticket) => (
                    <div key={ticket.id} className="border rounded-lg p-3 space-y-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{ticket.name}</p>
                          <p className="text-sm text-muted-foreground">{ticket.description}</p>
                        </div>
                        <p className="font-bold">{formatCurrency(ticket.price)}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {ticket.quantity_available - ticket.quantity_sold} available
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button className="w-full" size="lg" disabled={isSoldOut} asChild={!isSoldOut}>
                  {isSoldOut ? (
                    <span>Sold Out</span>
                  ) : (
                    <Link href={`/events/${event.slug}/book`}>Book Now</Link>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Event
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
