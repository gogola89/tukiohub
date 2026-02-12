'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { attendeeFormSchema, AttendeeFormInput } from '@/lib/validations/booking';
import { formatPhoneForBackend } from '@/lib/utils/phone';
import { User } from 'lucide-react';

interface AttendeeFormProps {
  onSubmit: (data: AttendeeFormInput) => void;
  isSubmitting?: boolean;
  defaultValues?: Partial<AttendeeFormInput>;
}

export default function AttendeeForm({ onSubmit, isSubmitting = false, defaultValues }: AttendeeFormProps) {
  const form = useForm<AttendeeFormInput>({
    resolver: zodResolver(attendeeFormSchema),
    defaultValues: {
      attendee_name: defaultValues?.attendee_name || '',
      attendee_email: defaultValues?.attendee_email || '',
      attendee_phone: defaultValues?.attendee_phone || '',
      notes: defaultValues?.notes || '',
    },
  });

  const handleSubmit = (data: AttendeeFormInput) => {
    // Format phone number for backend (remove + prefix)
    const formattedData = {
      ...data,
      attendee_phone: formatPhoneForBackend(data.attendee_phone),
    };
    onSubmit(formattedData);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="w-5 h-5" />
          <CardTitle>Attendee Information</CardTitle>
        </div>
        <CardDescription>
          Please provide your contact information for ticket delivery
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="attendee_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="attendee_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Your tickets will be sent to this email
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="attendee_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <PhoneInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="712 345 678"
                      error={!!form.formState.errors.attendee_phone}
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special requirements or notes for the organizer..."
                      {...field}
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Continue to Payment'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
