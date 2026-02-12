'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { attendeesAPI } from '@/lib/api/endpoints/attendees';
import { useAttendeeAuthStore } from '@/lib/store/attendeeAuthStore';
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
import { PhoneInput } from '@/components/ui/phone-input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { formatPhoneForBackend } from '@/lib/utils/phone';

const registrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  phone_number: z.string().regex(/^\+254\d{9}$/, 'Phone number must start with +254 and be 13 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password2: z.string(),
  is_subscribed: z.boolean().optional(),
}).refine((data) => data.password === data.password2, {
  message: "Passwords don't match",
  path: ['password2'],
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export default function AttendeeRegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { setAttendee, setTokens } = useAttendeeAuthStore();

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      email: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      password: '',
      password2: '',
      is_subscribed: false,
    },
  });

  const onSubmit = async (data: RegistrationFormData) => {
    setIsLoading(true);
    try {
      // Format phone number for backend (remove + prefix)
      const formattedData = {
        ...data,
        phone_number: formatPhoneForBackend(data.phone_number),
      };

      const response = await attendeesAPI.register(formattedData);

      // Don't auto-login - require email verification first
      toast.success('Registration successful! Please check your email to verify your account.');
      router.push('/login?registered=true');
    } catch (error: any) {
      console.error('Registration error:', error);

      if (error.response?.data) {
        // Handle field-specific errors
        const errors = error.response.data;
        Object.keys(errors).forEach((key) => {
          const errorMessage = Array.isArray(errors[key])
            ? errors[key].join(', ')
            : errors[key];
          toast.error(`${key}: ${errorMessage}`);
        });
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create Attendee Account</CardTitle>
          <CardDescription>
            Register to book events, manage your tickets, and use wallet features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                      />
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
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <PhoneInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="712 345 678"
                        error={!!form.formState.errors.phone_number}
                      />
                    </FormControl>
                    <FormDescription>
                      Kenya phone number (country code +254 is added automatically)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password *</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormDescription>
                      At least 8 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password *</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_subscribed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Subscribe to newsletter</FormLabel>
                      <FormDescription>
                        Receive updates about events and promotions
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/login" className="text-primary hover:underline">
              Login here
            </Link>
          </div>

          <div className="mt-2 text-center text-sm">
            <span className="text-muted-foreground">Want to organize events? </span>
            <Link href="/register/organizer" className="text-primary hover:underline">
              Register as Organizer
            </Link>
          </div>

          <div className="mt-2 text-center text-sm">
            <Link href="/register" className="text-muted-foreground hover:text-primary hover:underline">
              ← Back to registration options
            </Link>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
