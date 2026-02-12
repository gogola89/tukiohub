'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePublicEvents } from '@/lib/hooks/useEvents';
import EventGrid from '@/components/events/EventGrid';
import EventFilter, { FilterValues } from '@/components/events/EventFilter';
import EventSearch from '@/components/events/EventSearch';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { Filter, Calendar, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({});
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1')
  );
  const [pageSize] = useState(12);

  // Build query params from filters and search
  const queryParams = {
    ...filters,
    search: searchQuery || undefined,
    page: currentPage,
    page_size: pageSize,
  };

  const { data, isLoading, error } = usePublicEvents(queryParams);

  // Update search query from URL param on mount
  useEffect(() => {
    const search = searchParams.get('search');
    if (search) {
      setSearchQuery(search);
    }
  }, [searchParams]);

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      router.push(`/events?search=${encodeURIComponent(query)}`);
    } else {
      router.push('/events');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams);
    params.set('page', String(page));
    router.push(`/events?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Browse Events</h1>
        <p className="text-muted-foreground">
          Discover amazing events happening across Kenya
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <EventSearch
          onSearch={handleSearch}
          defaultValue={searchQuery}
          placeholder="Search events by name, location, or description..."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block">
          <EventFilter onFilterChange={handleFilterChange} />
        </aside>

        {/* Mobile Filter Button */}
        <div className="lg:hidden mb-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowMobileFilter(true)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Mobile Filter Overlay */}
        {showMobileFilter && (
          <EventFilter
            onFilterChange={handleFilterChange}
            showMobileFilter={showMobileFilter}
            onCloseMobileFilter={() => setShowMobileFilter(false)}
          />
        )}

        {/* Events Grid */}
        <main className="lg:col-span-3">
          {/* No Events State */}
          {!isLoading && !error && data?.count === 0 && (
            <Card className="mt-8">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {searchQuery || Object.keys(filters).length > 0
                    ? 'No Events Match Your Criteria'
                    : 'No Events Available Yet'}
                </h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  {searchQuery
                    ? `No events match "${searchQuery}". Try adjusting your search or filters, or check back soon!`
                    : Object.keys(filters).length > 0
                    ? 'No events match your current filters. Try adjusting your selection or browse all events!'
                    : 'There are currently no events available. Check back soon for exciting upcoming events!'}
                </p>
                {(searchQuery || Object.keys(filters).length > 0) ? (
                  <Button asChild>
                    <Link href="/events">
                      <Search className="w-4 h-4 mr-2" />
                      Browse All Events
                    </Link>
                  </Button>
                ) : null}
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
                <Button onClick={() => window.location.reload()} variant="outline">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {!error && (
            <>
              {/* Results Count */}
              {data && !isLoading && data.count > 0 && (
                <div className="mb-4 text-sm text-muted-foreground">
                  Showing {data.results.length} of {data.count} events
                </div>
              )}

              {/* Event Grid - Show skeleton while loading or events when loaded */}
              {(isLoading || (data && data.count > 0)) && (
                <EventGrid events={data?.results || []} isLoading={isLoading} />
              )}

              {/* No results message */}
              {!isLoading && data && data.count === 0 && (
                <div className="text-center py-12">
                  <h3 className="text-lg font-semibold text-muted-foreground">No events found</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try adjusting your search or filters
                  </p>
                </div>
              )}

              {/* Pagination */}
              {data && data.count > pageSize && (
                <div className="mt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(data.count / pageSize)}
                    onPageChange={handlePageChange}
                    hasNext={!!data.next}
                    hasPrevious={!!data.previous}
                    totalCount={data.count}
                    pageSize={pageSize}
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
