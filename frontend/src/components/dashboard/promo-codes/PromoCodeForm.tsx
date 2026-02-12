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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { PromoCode } from '@/types/event';

const promoCodeSchema = z.object({
  code: z.string().min(1, 'Promo code is required').toUpperCase(),
  discount_type: z.enum(['PERCENTAGE', 'FIXED']),
  discount_value: z.number().min(0, 'Discount value must be positive'),
  usage_limit: z.number().min(0).optional(),
  valid_from: z.string().min(1, 'Start date is required'),
  valid_until: z.string().min(1, 'End date is required'),
  is_active: z.boolean(),
});

type PromoCodeInput = z.infer<typeof promoCodeSchema>;

interface PromoCodeFormProps {
  eventId: string;
  promoCode?: PromoCode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PromoCodeForm({
  eventId,
  promoCode,
  open,
  onOpenChange,
}: PromoCodeFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!promoCode;

  const form = useForm<PromoCodeInput>({
    resolver: zodResolver(promoCodeSchema) as any,
    defaultValues: promoCode
      ? {
          code: promoCode.code,
          discount_type: promoCode.discount_type,
          discount_value: promoCode.discount_value,
          usage_limit: promoCode.usage_limit || undefined,
          valid_from: promoCode.valid_from.split('T')[0],
          valid_until: promoCode.valid_until.split('T')[0],
          is_active: promoCode.is_active,
        }
      : {
          code: '',
          discount_type: 'PERCENTAGE',
          discount_value: 0,
          usage_limit: undefined,
          valid_from: '',
          valid_until: '',
          is_active: true,
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: PromoCodeInput) => {
      console.log('Raw promo code data:', data);

      const formattedData: any = {
        code: data.code,
        discount_type: data.discount_type,
        discount_value: Number(data.discount_value),
        usage_limit: data.usage_limit && data.usage_limit > 0 ? Number(data.usage_limit) : null,
        valid_from: data.valid_from + 'T00:00:00Z',
        valid_until: data.valid_until + 'T23:59:59Z',
        is_active: data.is_active,
      };

      console.log('Formatted promo code data:', formattedData);
      return eventsAPI.createPromoCode(eventId, formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      toast.success('Promo code created successfully');
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      console.error('Create promo code error:', error.response?.data);
      const errorMessage = error.response?.data?.message
        || error.response?.data?.detail
        || JSON.stringify(error.response?.data)
        || 'Failed to create promo code';
      toast.error(errorMessage);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: PromoCodeInput) => {
      console.log('Raw promo code data for update:', data);

      const formattedData: any = {
        code: data.code,
        discount_type: data.discount_type,
        discount_value: Number(data.discount_value),
        usage_limit: data.usage_limit && data.usage_limit > 0 ? Number(data.usage_limit) : null,
        valid_from: data.valid_from + 'T00:00:00Z',
        valid_until: data.valid_until + 'T23:59:59Z',
        is_active: data.is_active,
      };

      console.log('Formatted promo code data for update:', formattedData);
      return eventsAPI.updatePromoCode(eventId, promoCode!.id, formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      toast.success('Promo code updated successfully');
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Update promo code error:', error.response?.data);
      const errorMessage = error.response?.data?.message
        || error.response?.data?.detail
        || JSON.stringify(error.response?.data)
        || 'Failed to update promo code';
      toast.error(errorMessage);
    },
  });

  const onSubmit = (data: PromoCodeInput) => {
    console.log('Promo code form submitted:', data);
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const discountType = form.watch('discount_type');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Promo Code' : 'Create Promo Code'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the details of your promo code'
              : 'Create a new discount code for your event'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Promo Code *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="EARLYBIRD"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormDescription>
                    Code customers will use (automatically converted to uppercase)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discount_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                        <SelectItem value="FIXED">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discount_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Discount Value * {discountType === 'PERCENTAGE' ? '(%)' : '(KES)'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={discountType === 'PERCENTAGE' ? '20' : '500'}
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? 0 : parseFloat(value) || 0);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      {discountType === 'PERCENTAGE'
                        ? 'Enter percentage (e.g., 20 for 20% off)'
                        : 'Enter fixed amount in KES'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valid_from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid From *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valid_until"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid Until *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="usage_limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usage Limit</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="100"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === '' ? undefined : parseInt(value) || 0);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Max times code can be used (leave empty for unlimited)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      Promo code is available for use
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
