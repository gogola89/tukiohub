'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { verifyTicketSchema, VerifyTicketData } from '@/lib/validations/ticket';
import { ticketsAPI, TicketVerificationResponse } from '@/lib/api/endpoints/tickets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Scan,
  Calendar,
  MapPin,
  User,
  Mail,
} from 'lucide-react';

/**
 * TicketVerification component
 * Allows verification of tickets by entering ticket code or scanning QR
 */
export default function TicketVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] =
    useState<TicketVerificationResponse | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<VerifyTicketData>({
    resolver: zodResolver(verifyTicketSchema),
  });

  const onSubmit = async (data: VerifyTicketData) => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const result = await ticketsAPI.verifyTicket(data.ticket_code);
      setVerificationResult(result);

      if (result.valid) {
        toast.success('Ticket is valid!');
      } else {
        toast.error(result.message || 'Invalid ticket');
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message || 'Failed to verify ticket';
      toast.error(message);
      setVerificationResult({
        valid: false,
        message,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReset = () => {
    reset();
    setVerificationResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Verification Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="ticket_code">Ticket Code</Label>
            <div className="flex gap-2">
              <Input
                id="ticket_code"
                {...register('ticket_code')}
                placeholder="TK-XXXXXX"
                className={errors.ticket_code ? 'border-red-500' : ''}
              />
              <Button
                type="submit"
                disabled={isVerifying}
                className="min-w-[120px]"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Scan className="w-4 h-4 mr-2" />
                    Verify
                  </>
                )}
              </Button>
            </div>
            {errors.ticket_code && (
              <p className="text-sm text-red-500 mt-1">
                {errors.ticket_code.message}
              </p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              Enter the ticket code (e.g., TK-ABC123) to verify its validity.
              Scan QR codes to get the ticket code automatically.
            </p>
          </div>
        </form>
      </Card>

      {/* Verification Result */}
      {verificationResult && (
        <Card className="p-6">
          <div className="space-y-4">
            {/* Status Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                {verificationResult.valid ? (
                  <>
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-green-600">
                        Valid Ticket
                      </h3>
                      <p className="text-sm text-gray-600">
                        This ticket is authentic and active
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100">
                      <XCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-red-600">
                        Invalid Ticket
                      </h3>
                      <p className="text-sm text-gray-600">
                        {verificationResult.message}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Ticket Details */}
            {verificationResult.valid && verificationResult.ticket && (
              <div className="space-y-4">
                {/* Event Information */}
                {verificationResult.event && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Event Details
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-gray-500 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {verificationResult.event.title}
                          </p>
                          <p className="text-sm text-gray-600">
                            {format(
                              new Date(verificationResult.event.start_datetime),
                              'PPP p'
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <p className="text-sm text-gray-600">
                          {verificationResult.event.venue_name}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ticket Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Ticket Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">
                        Ticket Code
                      </p>
                      <p className="font-mono font-semibold text-gray-900">
                        {verificationResult.ticket.ticket_code}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">
                        Ticket Type
                      </p>
                      <p className="font-semibold text-gray-900">
                        {verificationResult.ticket.ticket_type.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Status</p>
                      <Badge
                        className={
                          verificationResult.ticket.status === 'ACTIVE'
                            ? 'bg-green-500'
                            : verificationResult.ticket.status === 'USED'
                            ? 'bg-blue-500'
                            : 'bg-gray-500'
                        }
                      >
                        {verificationResult.ticket.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Price</p>
                      <p className="font-semibold text-gray-900">
                        KES{' '}
                        {verificationResult.ticket.ticket_type.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Attendee Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Attendee Information
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <p className="text-sm font-medium text-gray-900">
                        {verificationResult.ticket.attendee_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <p className="text-sm text-gray-600">
                        {verificationResult.ticket.attendee_email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Usage Information */}
                {verificationResult.ticket.status === 'USED' &&
                  verificationResult.ticket.used_at && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-900">
                        <strong>Already Checked In:</strong> This ticket was used
                        on{' '}
                        {format(
                          new Date(verificationResult.ticket.used_at),
                          'PPP p'
                        )}
                      </p>
                    </div>
                  )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleReset} variant="outline" className="flex-1">
                Verify Another Ticket
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
