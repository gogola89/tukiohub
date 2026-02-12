'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '@/lib/api/endpoints/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Users, Calendar, Mail, Phone, Building, Check, X, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminOrganizerDetailsPage() {
  const { id } = useParams<{ id: string }>();
  
  const { data: organizer, isLoading, error } = useQuery({
    queryKey: ['admin-organizer-details', id],
    queryFn: () => adminAPI.getOrganizerDetails(id),
  });

  const statusColors = {
    PENDING: 'bg-yellow-500',
    APPROVED: 'bg-green-500',
    REJECTED: 'bg-red-500',
  };

  const handleApprove = () => {
    if (confirm('Are you sure you want to approve this organizer? They will be able to create events.')) {
      adminAPI.approveRejectOrganizer(id, 'APPROVED')
        .then(() => {
          toast.success('Organizer approved successfully');
          // In a real app, we would refetch the data or update the state
        })
        .catch((error) => {
          toast.error(error.response?.data?.message || 'Failed to approve organizer');
        });
    }
  };

  const handleReject = () => {
    const reason = prompt('Enter reason for rejection (optional):');
    if (reason !== null) { // User didn't cancel
      adminAPI.approveRejectOrganizer(id, 'REJECTED', reason || undefined)
        .then(() => {
          toast.success('Organizer rejected successfully');
          // In a real app, we would refetch the data or update the state
        })
        .catch((error) => {
          toast.error(error.response?.data?.message || 'Failed to reject organizer');
        });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-1/3 mb-8" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-96 mt-6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Failed to load organizer details. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  if (!organizer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Organizer not found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{organizer.company_name}</h1>
          <p className="text-muted-foreground">{organizer.email}</p>
        </div>
        <div className="flex gap-2">
          {organizer.verification_status === 'PENDING' && (
            <>
              <Button onClick={handleApprove} variant="default">
                <Check className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button onClick={handleReject} variant="destructive">
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </>
          )}
          {organizer.verification_status === 'APPROVED' && (
            <Button onClick={handleReject} variant="destructive">
              <X className="mr-2 h-4 w-4" />
              Reject
            </Button>
          )}
          {organizer.verification_status === 'REJECTED' && (
            <Button onClick={handleApprove} variant="default">
              <Check className="mr-2 h-4 w-4" />
              Approve
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Organizer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Organizer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-muted rounded-full p-2">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{organizer.email}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-muted rounded-full p-2">
                <Building className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <p className="font-medium">{organizer.company_name}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-muted rounded-full p-2">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{organizer.phone_number}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-muted rounded-full p-2">
                <Check className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={statusColors[organizer.verification_status]}>
                  {organizer.verification_status}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-muted rounded-full p-2">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Joined</p>
                <p className="font-medium">{format(new Date(organizer.created_at), 'PPP')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Verification Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {organizer.verification_documents && organizer.verification_documents.length > 0 ? (
              <div className="space-y-2">
                {organizer.verification_documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                    <span className="text-sm">Document {index + 1}</span>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No verification documents provided</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Events Created by Organizer */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Events Created
          </CardTitle>
        </CardHeader>
        <CardContent>
          {organizer.events && organizer.events.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Event</th>
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Tickets Sold</th>
                    <th className="text-left py-2">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {organizer.events.map((event) => (
                    <tr key={event.id} className="border-b">
                      <td className="py-2 font-medium">{event.title}</td>
                      <td className="py-2">{format(new Date(event.start_datetime), 'PPP')}</td>
                      <td className="py-2">{event.tickets_sold}</td>
                      <td className="py-2">KES {event.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No events created yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}