'use client';

import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '@/lib/api/endpoints/admin';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Calendar, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';

export default function AdminEventsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10); // Fixed page size

  const queryParams = {
    page: currentPage,
    page_size: pageSize,
    ...(statusFilter !== 'all' && { status: statusFilter.toUpperCase() }),
    ...(searchQuery && { search: searchQuery }),
  };

  const { data: eventsData, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-events', queryParams],
    queryFn: () => adminAPI.getEvents(queryParams),
    refetchOnWindowFocus: false,
  });

  const events = eventsData?.results || [];
  const totalEvents = eventsData?.count || 0;
  const totalPages = Math.ceil(totalEvents / pageSize);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Event Management</h1>
          <p className="text-muted-foreground">
            Manage all events on the platform
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }}
              className="pl-10 w-full sm:w-auto"
            />
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1); // Reset to first page when filtering
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => refetch()}>
              <Calendar className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="rounded-md border">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left py-3 px-4 font-medium">Event</th>
                <th className="text-left py-3 px-4 font-medium">Organizer</th>
                <th className="text-left py-3 px-4 font-medium">Date</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium">Tickets Sold</th>
                <th className="text-left py-3 px-4 font-medium">Revenue</th>
                <th className="text-right py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, index) => (
                <tr key={index} className="border-b">
                  <td className="py-3 px-4">
                    <Skeleton className="h-4 w-3/4" />
                  </td>
                  <td className="py-3 px-4">
                    <Skeleton className="h-4 w-1/2" />
                  </td>
                  <td className="py-3 px-4">
                    <Skeleton className="h-4 w-1/3" />
                  </td>
                  <td className="py-3 px-4">
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </td>
                  <td className="py-3 px-4">
                    <Skeleton className="h-4 w-1/4" />
                  </td>
                  <td className="py-3 px-4">
                    <Skeleton className="h-4 w-1/3" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Skeleton className="h-8 w-16 ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Failed to load events. Please try again later.
          </p>
        </div>
      )}

      {/* Events Table */}
      <div className="rounded-md border">
        <table className="w-full">
          <thead className="border-b">
            <tr>
              <th className="text-left py-3 px-4 font-medium">Event</th>
              <th className="text-left py-3 px-4 font-medium">Organizer</th>
              <th className="text-left py-3 px-4 font-medium">Date</th>
              <th className="text-left py-3 px-4 font-medium">Status</th>
              <th className="text-left py-3 px-4 font-medium">Tickets Sold</th>
              <th className="text-left py-3 px-4 font-medium">Revenue</th>
              <th className="text-right py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-b hover:bg-muted/50">
                <td className="py-3 px-4">
                  <div className="font-medium">{event.title}</div>
                </td>
                <td className="py-3 px-4">{event.organizer?.company_name || 'Unknown Organizer'}</td>
                <td className="py-3 px-4">{new Date(event.date).toLocaleDateString()}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    event.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                    event.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                    event.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {event.status}
                  </span>
                </td>
                <td className="py-3 px-4">{event.tickets_sold}</td>
                <td className="py-3 px-4">KES {event.revenue.toLocaleString()}</td>
                <td className="py-3 px-4 text-right">
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalEvents > 0 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            hasNext={currentPage < totalPages}
            hasPrevious={currentPage > 1}
            totalCount={totalEvents}
            pageSize={pageSize}
          />
        </div>
      )}

      {events.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Calendar className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No events found</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            {searchQuery || statusFilter !== 'all'
              ? 'No events match your current filters.'
              : 'There are no events on the platform yet.'}
          </p>
          {(searchQuery || statusFilter !== 'all') && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}