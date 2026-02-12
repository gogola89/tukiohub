'use client';

import { use } from 'react';
import { usePublicEvents } from '@/lib/hooks/useEvents';
import EventGrid from '@/components/events/EventGrid';
import EventSearch from '@/components/events/EventSearch';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Calendar, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EventCategory } from '@/types/event';

interface PageProps {
  params: Promise<{ category: string }>;
}

export default function CategoryPage({ params }: PageProps) {
  const router = useRouter();
  const { category } = use(params);

  const { data, isLoading, error } = usePublicEvents({
    category: category.toUpperCase() as EventCategory,
  });

  const getCategoryLabel = (cat?: string) => {
    if (!cat) return 'Event';
    return cat.charAt(0) + cat.slice(1).toLowerCase().replace('_', ' ');
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/events?search=${encodeURIComponent(query)}&category=${category}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/events">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to All Events
        </Link>
      </Button>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{getCategoryLabel(category)} Events</h1>
        <p className="text-muted-foreground">
          Browse all {getCategoryLabel(category).toLowerCase()} events
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <EventSearch
          onSearch={handleSearch}
          placeholder={`Search ${getCategoryLabel(category).toLowerCase()} events...`}
        />
      </div>

      {/* No Events State */}
      {!isLoading && !error && data?.count === 0 && (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No {getCategoryLabel(category)} Events Yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              There are currently no events in this category. Check back soon or browse other categories!
            </p>
            <Button asChild>
              <Link href="/events">
                <Search className="w-4 h-4 mr-2" />
                Browse All Events
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="mt-8 border-orange-200 bg-orange-50 dark:bg-orange-950">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-16 h-16 text-orange-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Unable to Load Events</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              We're having trouble loading events right now. Please try again in a moment.
            </p>
            <Button asChild variant="outline">
              <Link href="/events">Browse All Events</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results Count */}
      {data && !isLoading && !error && data.count > 0 && (
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {data.results.length} of {data.count} events
        </div>
      )}

      {/* Events Grid - Show skeleton during loading or actual events when loaded */}
      {!error && (isLoading || (data && data.count > 0)) && (
        <EventGrid events={data?.results || []} isLoading={isLoading} />
      )}

      {/* Pagination - Basic implementation */}
      {data && data.count > (data.results?.length || 0) && (
        <div className="mt-8 flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={!data.previous}
            onClick={() => {
              // Implement pagination logic
            }}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={!data.next}
            onClick={() => {
              // Implement pagination logic
            }}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
