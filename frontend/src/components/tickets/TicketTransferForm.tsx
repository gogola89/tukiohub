'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transferTicketSchema, TransferTicketData } from '@/lib/validations/ticket';
import { ticketsAPI } from '@/lib/api/endpoints/tickets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { Loader2, Send } from 'lucide-react';

interface TicketTransferFormProps {
  ticketCode: string;
  onSuccess?: () => void;
}

/**
 * TicketTransferForm component
 * Form for transferring a ticket to another person
 */
export default function TicketTransferForm({
  ticketCode,
  onSuccess,
}: TicketTransferFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TransferTicketData>({
    resolver: zodResolver(transferTicketSchema),
  });

  const onSubmit = async (data: TransferTicketData) => {
    setIsSubmitting(true);
    try {
      await ticketsAPI.transferTicket(ticketCode, data);
      toast.success('Ticket transferred successfully!');
      reset();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message || 'Failed to transfer ticket';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-900">
          Transfer this ticket to another attendee. The new attendee will receive
          the ticket via email and you will no longer have access to it.
        </p>
      </div>

      <div>
        <Label htmlFor="new_attendee_name">Full Name</Label>
        <Input
          id="new_attendee_name"
          {...register('new_attendee_name')}
          placeholder="Enter full name"
          className={errors.new_attendee_name ? 'border-red-500' : ''}
        />
        {errors.new_attendee_name && (
          <p className="text-sm text-red-500 mt-1">
            {errors.new_attendee_name.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="new_attendee_email">Email Address</Label>
        <Input
          id="new_attendee_email"
          type="email"
          {...register('new_attendee_email')}
          placeholder="email@example.com"
          className={errors.new_attendee_email ? 'border-red-500' : ''}
        />
        {errors.new_attendee_email && (
          <p className="text-sm text-red-500 mt-1">
            {errors.new_attendee_email.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="new_attendee_phone">Phone Number</Label>
        <Input
          id="new_attendee_phone"
          {...register('new_attendee_phone')}
          placeholder="+254722334455"
          className={errors.new_attendee_phone ? 'border-red-500' : ''}
        />
        {errors.new_attendee_phone && (
          <p className="text-sm text-red-500 mt-1">
            {errors.new_attendee_phone.message}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Format: +254XXXXXXXXX (13 characters)
        </p>
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Transferring...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Transfer Ticket
            </>
          )}
        </Button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-xs text-yellow-900">
          <strong>Important:</strong> This action cannot be undone. Make sure the
          details are correct before transferring.
        </p>
      </div>
    </form>
  );
}
