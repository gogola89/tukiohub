'use client';

import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '@/lib/api/endpoints/admin';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Users, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import OrganizerListTable from '@/components/admin/OrganizerListTable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { Pagination } from '@/components/ui/pagination';

export default function AdminOrganizersPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10); // Fixed page size

  // Fetch all organizers
  const { data: allOrganizers, isLoading, error } = useQuery({
    queryKey: ['admin-organizers'],
    queryFn: adminAPI.getOrganizers,
  });

  // Filter organizers based on status
  const filteredOrganizers = allOrganizers?.filter(organizer => {
    if (statusFilter === 'all') return true;
    return organizer.verification_status.toLowerCase() === statusFilter;
  }) || [];

  // Calculate pagination
  const totalOrganizers = filteredOrganizers.length;
  const totalPages = Math.ceil(totalOrganizers / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedOrganizers = filteredOrganizers.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Organizer Management</h1>
          <p className="text-muted-foreground">
            Manage event organizers and their verification status
          </p>
        </div>
        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1); // Reset to first page when filtering
          }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Organizers</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && (
        <div className="rounded-md border">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left py-3 px-4 font-medium">Organizer</th>
                <th className="text-left py-3 px-4 font-medium">Company</th>
                <th className="text-left py-3 px-4 font-medium">Phone</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium">Joined</th>
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
                    <Skeleton className="h-4 w-1/3" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Skeleton className="h-8 w-8 ml-auto" />
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
            Failed to load organizers. Please try again later.
          </p>
        </div>
      )}

      {!isLoading && !error && paginatedOrganizers && Array.isArray(paginatedOrganizers) && paginatedOrganizers.length > 0 && (
        <OrganizerListTable organizers={paginatedOrganizers} isLoading={isLoading} />
      )}

      {!isLoading && !error && paginatedOrganizers && Array.isArray(paginatedOrganizers) && paginatedOrganizers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Users className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No organizers found</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            {statusFilter !== 'all'
              ? 'No organizers match your current filter.'
              : 'There are no organizers registered on the platform yet.'}
          </p>
          {statusFilter !== 'all' && (
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter('all');
                setCurrentPage(1);
              }}
            >
              Clear Filter
            </Button>
          )}
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Failed to load organizers data.
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalOrganizers > 0 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            hasNext={currentPage < totalPages}
            hasPrevious={currentPage > 1}
            totalCount={totalOrganizers}
            pageSize={pageSize}
          />
        </div>
      )}
    </div>
  );
}