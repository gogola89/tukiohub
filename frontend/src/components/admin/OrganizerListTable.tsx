'use client';

import { Organizer } from '@/lib/api/endpoints/admin';
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
import { MoreHorizontal, Eye, Check, X, FileText } from 'lucide-react';
import { adminAPI } from '@/lib/api/endpoints/admin';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

interface OrganizerListTableProps {
  organizers: Organizer[];
  isLoading?: boolean;
}

const statusColors = {
  PENDING: 'bg-yellow-500',
  APPROVED: 'bg-green-500',
  REJECTED: 'bg-red-500',
};

export default function OrganizerListTable({ organizers, isLoading }: OrganizerListTableProps) {
  const queryClient = useQueryClient();

  const approvalMutation = useMutation({
    mutationFn: ({ organizerId, status, reason }: { organizerId: string; status: 'APPROVED' | 'REJECTED'; reason?: string }) => 
      adminAPI.approveRejectOrganizer(organizerId, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizers'] });
      toast.success('Organizer status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update organizer status');
    },
  });

  const handleApprove = (organizerId: string) => {
    if (confirm('Are you sure you want to approve this organizer? They will be able to create events.')) {
      approvalMutation.mutate({ organizerId, status: 'APPROVED' });
    }
  };

  const handleReject = (organizerId: string) => {
    const reason = prompt('Enter reason for rejection (optional):');
    if (reason !== null) { // User didn't cancel
      approvalMutation.mutate({ organizerId, status: 'REJECTED', reason: reason || undefined });
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organizer</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
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

  if (organizers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <h3 className="text-lg font-semibold mb-2">No organizers yet</h3>
        <p className="text-muted-foreground mb-4">
          No organizers have registered on the platform yet
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Organizer</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {organizers.map((organizer) => (
            <TableRow key={organizer.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{organizer.email}</div>
                  <div className="text-sm text-muted-foreground">
                    {organizer.company_name}
                  </div>
                </div>
              </TableCell>
              <TableCell>{organizer.company_name}</TableCell>
              <TableCell>{organizer.phone_number}</TableCell>
              <TableCell>
                <Badge className={statusColors[organizer.verification_status]}>
                  {organizer.verification_status}
                </Badge>
              </TableCell>
              <TableCell>
                {format(new Date(organizer.created_at), 'PPP')}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/organizers/${organizer.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {organizer.verification_status === 'PENDING' && (
                      <>
                        <DropdownMenuItem onClick={() => handleApprove(organizer.id)}>
                          <Check className="mr-2 h-4 w-4" />
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleReject(organizer.id)}>
                          <X className="mr-2 h-4 w-4" />
                          Reject
                        </DropdownMenuItem>
                      </>
                    )}
                    {organizer.verification_status === 'APPROVED' && (
                      <DropdownMenuItem onClick={() => handleReject(organizer.id)}>
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </DropdownMenuItem>
                    )}
                    {organizer.verification_status === 'REJECTED' && (
                      <DropdownMenuItem onClick={() => handleApprove(organizer.id)}>
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                      </DropdownMenuItem>
                    )}
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