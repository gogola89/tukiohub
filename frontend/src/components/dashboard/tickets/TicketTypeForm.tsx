'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsAPI } from '@/lib/api/endpoints/events';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { ticketTypeSchema, TicketTypeInput } from '@/lib/validations/event';
import { TicketType } from '@/types/event';

interface TicketTypeFormProps {
  eventId: string;
  ticketType?: TicketType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TicketTypeForm({
  eventId,
  ticketType,
  open,
  onOpenChange,
}: TicketTypeFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!ticketType;

  const form = useForm<TicketTypeInput>({
    resolver: zodResolver(ticketTypeSchema) as any,
    defaultValues: ticketType
      ? {
          name: ticketType.name,
          description: ticketType.description,
          price: ticketType.price,
          quantity_available: ticketType.quantity_available,
          sales_start_date: ticketType.sales_start_date.slice(0, 16), // Format: YYYY-MM-DDTHH:mm
          sales_end_date: ticketType.sales_end_date.slice(0, 16),
          min_purchase: ticketType.min_purchase || 1,
          max_purchase: ticketType.max_purchase || 10,
          is_active: ticketType.is_active,
        }
      : {
          name: '',
          description: '',
          price: 0,
          quantity_available: 100,
          sales_start_date: '',
          sales_end_date: '',
          min_purchase: 1,
          max_purchase: 10,
          is_active: true,
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: TicketTypeInput) => {
      console.log('Raw form data:', data);

      // Format data to match backend API requirements
      // Backend expects ISO 8601 format: "2025-12-26T14:30:00Z"
      const formattedData = {
        name: data.name,
        description: data.description || '',
        price: Number(data.price),
        quantity_available: Number(data.quantity_available),
        sales_start_date: new Date(data.sales_start_date).toISOString(),
        sales_end_date: new Date(data.sales_end_date).toISOString(),
        min_purchase: Number(data.min_purchase),
        max_purchase: Number(data.max_purchase),
        is_active: data.is_active !== undefined ? data.is_active : true,
      };
      console.log('Formatted data for API:', formattedData);
      console.log('Event ID:', eventId);
      console.log('API URL will be:', `/events/${eventId}/tickets/`);
      return eventsAPI.createTicketType(eventId, formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      toast.success('Ticket type created successfully');
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      console.error('Full error object:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);

      let errorMessage = 'Failed to create ticket type';

      if (error.response?.data) {
        // Check if it's a validation error object with field-specific errors
        if (typeof error.response.data === 'object' && !error.response.data.message && !error.response.data.detail) {
          // It's likely a field validation error object
          const fieldErrors = Object.entries(error.response.data)
            .map(([field, errors]: [string, any]) => {
              if (Array.isArray(errors)) {
                return `${field}: ${errors.join(', ')}`;
              }
              return `${field}: ${errors}`;
            })
            .join('\n');
          errorMessage = fieldErrors || JSON.stringify(error.response.data);
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else {
          errorMessage = JSON.stringify(error.response.data);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, { duration: 6000 });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: TicketTypeInput) => {
      console.log('Raw form data for update:', data);

      // Format data to match backend API requirements
      // Backend expects ISO 8601 format: "2025-12-26T14:30:00Z"
      const formattedData = {
        name: data.name,
        description: data.description || '',
        price: Number(data.price),
        quantity_available: Number(data.quantity_available),
        sales_start_date: new Date(data.sales_start_date).toISOString(),
        sales_end_date: new Date(data.sales_end_date).toISOString(),
        min_purchase: Number(data.min_purchase),
        max_purchase: Number(data.max_purchase),
        is_active: data.is_active !== undefined ? data.is_active : true,
      };
      console.log('Formatted data for update API:', formattedData);
      return eventsAPI.updateTicketType(eventId, ticketType!.id, formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      toast.success('Ticket type updated successfully');
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Update ticket type error:', error.response?.data);
      const errorMessage = error.response?.data?.message
        || error.response?.data?.detail
        || JSON.stringify(error.response?.data)
        || 'Failed to update ticket type';
      toast.error(errorMessage);
    },
  });

  const onSubmit = (data: TicketTypeInput) => {
    console.log('Ticket type form submitted:', data);
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Ticket Type' : 'Create Ticket Type'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the details of your ticket type'
              : 'Add a new ticket type for your event'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticket Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ticket type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="VVIP">VVIP</SelectItem>
                      <SelectItem value="VIP">VIP</SelectItem>
                      <SelectItem value="REGULAR">Regular</SelectItem>
                      <SelectItem value="EARLY_BIRD">Early Bird</SelectItem>
                      <SelectItem value="STUDENT">Student</SelectItem>
                      <SelectItem value="GROUP">Group</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what's included with this ticket"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (KES) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? 0 : parseFloat(value) || 0);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity_available"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity Available *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="100"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? 0 : parseInt(value) || 0);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sales_start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sales Start Date & Time *</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormDescription>When ticket sales begin</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sales_end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sales End Date & Time *</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormDescription>When ticket sales close</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="min_purchase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Purchase *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? 1 : parseInt(value) || 1);
                        }}
                      />
                    </FormControl>
                    <FormDescription>Minimum tickets per order</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_purchase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Purchase *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? 10 : parseInt(value) || 10);
                        }}
                      />
                    </FormControl>
                    <FormDescription>Maximum tickets per order</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      Ticket type is available for purchase
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : isEditing
                  ? 'Update'
                  : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
