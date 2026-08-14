'use client';

import { useQuery } from '@tanstack/react-query';
import { authAPI } from '@/lib/api/endpoints/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Calendar, Building, Phone } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminProfilePage() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['admin-profile'],
    queryFn: authAPI.getProfile,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-1/3 mb-8" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Failed to load profile. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            User not found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Admin Profile</h1>
        <Button variant="outline">Edit Profile</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-muted rounded-full p-2">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-muted rounded-full p-2">
                <Building className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <p className="font-medium">{user.company_name || 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-muted rounded-full p-2">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{user.phone_number || 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-muted rounded-full p-2">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Joined</p>
                <p className="font-medium">{user.created_at ? format(new Date(user.created_at), 'PPP') : 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-muted rounded-full p-2">
                <span className="h-4 w-4">👤</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <Badge variant="secondary">{user.role}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="h-5 w-5">⚙️</span>
              Account Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" variant="outline">
              Change Password
            </Button>
            <Button className="w-full" variant="outline">
              Update Profile
            </Button>
            <Button className="w-full" variant="outline">
              Security Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}