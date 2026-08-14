import { Event } from '@/types/event';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
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

  // Use is_sold_out from API if available, otherwise calculate
  const isSoldOut = event.is_sold_out ?? false;

  // Calculate available seats if we have the data
  const availableSeats = event.available_tickets ?? (event.capacity ? event.capacity - event.tickets_sold : 0);
  const isAlmostFull = !isSoldOut && availableSeats > 0 && event.capacity > 0 && availableSeats < event.capacity * 0.2;

  return (
    <Link href={`/events/${event.slug}`}>
      <Card className="group overflow-hidden hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1.5 transition-all duration-500 ease-out h-full border hover:border-primary/20">
        {/* Event Image */}
        <div className="relative aspect-video overflow-hidden bg-muted">
          {event.image ? (
            <Image
              src={event.image}
              alt={event.title}
              fill
              className="object-contain group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <div className="text-center p-4">
                <Calendar className="w-16 h-16 mx-auto mb-2 text-primary/40" />
                <p className="text-sm text-muted-foreground font-medium">{getCategoryLabel(event.category)}</p>
              </div>
            </div>
          )}
          {/* Status Badge */}
          {isSoldOut && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              Sold Out
            </div>
          )}
          {isAlmostFull && !isSoldOut && (
            <div className="absolute top-2 right-2 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              Almost Full
            </div>
          )}
          {/* Category Badge */}
          <div className="absolute top-2 left-2">
            <Badge className="bg-primary text-primary-foreground shadow-md">
              {getCategoryLabel(event.category)}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Event Title */}
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>

          {/* Date */}
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{format(new Date(event.start_datetime), 'EEE, MMM dd, yyyy • h:mm a')}</span>
          </div>

          {/* Location */}
          <div className="flex items-center text-sm text-muted-foreground">
            {event.is_online ? (
              <>
                <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-blue-600 font-medium">Online Event</span>
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="line-clamp-1">
                  {event.venue_name}
                </span>
              </>
            )}
          </div>

          {/* Capacity Info */}
          {(event.capacity > 0 || event.available_tickets !== undefined) && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>
                {event.available_tickets !== undefined && event.available_tickets !== null
                  ? `${event.available_tickets} tickets available`
                  : event.capacity > 0
                  ? `${event.tickets_sold || 0} / ${event.capacity} attendees`
                  : 'Limited availability'}
              </span>
            </div>
          )}

          {/* Organizer & Price */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center space-x-2">
              {event.organizer?.profile_image ? (
                <Image
                  src={event.organizer.profile_image}
                  alt={event.organizer.company_name}
                  width={24}
                  height={24}
                  className="rounded-full object-cover"
                />
              ) : event.organizer?.company_name ? (
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                  {event.organizer.company_name.charAt(0)}
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                  ?
                </div>
              )}
              <span className="text-sm text-muted-foreground truncate max-w-[120px]">
                {event.organizer?.company_name || 'Unknown Organizer'}
              </span>
            </div>

            <div className="text-right">
              {event.min_price !== undefined && event.min_price !== null ? (
                <div className="font-bold text-primary">
                  {event.min_price === 0 ? (
                    <span className="text-green-600">FREE</span>
                  ) : (
                    <>
                      From {formatCurrency(event.min_price)}
                    </>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Price TBA</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
