import { Event } from '@/types/event';
import EventCard from './EventCard';
import { CardSkeleton } from '@/components/ui/skeleton';

interface EventGridProps {
  events: Event[];
  isLoading?: boolean;
}

export default function EventGrid({ events, isLoading }: EventGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-muted-foreground">No events found</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
