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
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { EventAddon } from '@/types/event';

const addonSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().min(0, 'Price must be positive'),
  quantity_available: z.number().min(0).optional(),
  is_active: z.boolean(),
});

type AddonInput = z.infer<typeof addonSchema>;

interface AddonFormProps {
  eventId: string;
  addon?: EventAddon;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddonForm({
  eventId,
  addon,
  open,
  onOpenChange,
}: AddonFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!addon;

  const form = useForm<AddonInput>({
    resolver: zodResolver(addonSchema) as any,
    defaultValues: addon
      ? {
          name: addon.name,
          description: addon.description,
          price: addon.price,
          quantity_available: addon.quantity_available || undefined,
          is_active: true,
        }
      : {
          name: '',
          description: '',
          price: 0,
          quantity_available: undefined,
          is_active: true,
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: AddonInput) => {
      console.log('Raw addon data:', data);

      const formattedData: any = {
        name: data.name,
        description: data.description,
        price: Number(data.price),
        is_active: data.is_active,
      };

      if (data.quantity_available !== undefined && data.quantity_available > 0) {
        formattedData.quantity_available = Number(data.quantity_available);
      }

      console.log('Formatted addon data:', formattedData);
      return eventsAPI.createAddon(eventId, formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      toast.success('Add-on created successfully');
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      console.error('Create addon error:', error.response?.data);
      const errorMessage = error.response?.data?.message
        || error.response?.data?.detail
        || JSON.stringify(error.response?.data)
        || 'Failed to create add-on';
      toast.error(errorMessage);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: AddonInput) => {
      console.log('Raw addon data for update:', data);

      const formattedData: any = {
        name: data.name,
        description: data.description,
        price: Number(data.price),
        is_active: data.is_active,
      };

      if (data.quantity_available !== undefined && data.quantity_available > 0) {
        formattedData.quantity_available = Number(data.quantity_available);
      }

      console.log('Formatted addon data for update:', formattedData);
      return eventsAPI.updateAddon(eventId, addon!.id, formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      toast.success('Add-on updated successfully');
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Update addon error:', error.response?.data);
      const errorMessage = error.response?.data?.message
        || error.response?.data?.detail
        || JSON.stringify(error.response?.data)
        || 'Failed to update add-on';
      toast.error(errorMessage);
    },
  });

  const onSubmit = (data: AddonInput) => {
    console.log('Addon form submitted:', data);
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
            {isEditing ? 'Edit Add-on' : 'Create Add-on'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the details of your add-on'
              : 'Create a new add-on item for your event'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="VIP Parking"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Reserved parking space near venue entrance"
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
                        placeholder="500.00"
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
                    <FormLabel>Quantity Available</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="50"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? undefined : parseInt(value) || 0);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Leave empty for unlimited availability
                    </FormDescription>
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
                      Add-on is available for purchase
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
