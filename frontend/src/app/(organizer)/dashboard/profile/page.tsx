'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { updateProfileSchema, UpdateProfileInput } from '@/lib/validations/auth';
import { Loader2, Upload } from 'lucide-react';
import { useEffect } from 'react';

export default function ProfilePage() {
  const { user, profile, isLoadingProfile, updateProfile, isUpdatingProfile } = useAuth();

  // Use profile data from API if available, fallback to user from store
  const userData = profile || user;

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      company_name: userData?.company_name || '',
      phone_number: userData?.phone_number || '',
    },
  });

  // Update form when profile data loads
  useEffect(() => {
    if (userData) {
      form.reset({
        company_name: userData.company_name,
        phone_number: userData.phone_number,
      });
    }
  }, [userData, form]);

  const onSubmit = (data: UpdateProfileInput) => {
    updateProfile(data);
  };

  const getCompanyInitials = (companyName: string) => {
    if (!companyName) return 'C';
    const words = companyName.trim().split(/\s+/);
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return companyName.substring(0, 2).toUpperCase();
  };

  // Show loading state while fetching fresh profile data
  if (isLoadingProfile && !userData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your account information
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your account information
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Company Logo */}
        <Card>
          <CardHeader>
            <CardTitle>Company Logo</CardTitle>
            <CardDescription>
              Update your company logo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <Avatar className="h-32 w-32">
                <AvatarImage src={userData?.logo || undefined} alt={userData?.company_name} />
                <AvatarFallback className="text-2xl">
                  {userData && getCompanyInitials(userData.company_name)}
                </AvatarFallback>
              </Avatar>
            </div>
            <Button variant="outline" className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              Upload Logo
            </Button>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal and company details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Format: 254XXXXXXXXX
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUpdatingProfile}>
                    {isUpdatingProfile && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Account Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{userData?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium">{userData?.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Verification Status</span>
            <span className="font-medium">{userData?.verification_status || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email Verified</span>
            <span className="font-medium">{userData?.email_verified ? 'Yes' : 'No'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
