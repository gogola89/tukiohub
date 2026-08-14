'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { isAxiosError } from 'axios';
import { verifyTicketSchema, VerifyTicketData } from '@/lib/validations/ticket';
import { ticketsAPI, TicketVerificationResponse } from '@/lib/api/endpoints/tickets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QRScanner from './QRScanner';
import { toast } from 'react-hot-toast';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Scan,
  Camera,
  Keyboard,
  Calendar,
  MapPin,
  User,
  Mail,
} from 'lucide-react';

function getErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || fallback;
  }
  return fallback;
}

/**
 * TicketVerification component
 * Allows verification of tickets by entering ticket code or scanning QR
 */
export default function TicketVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [verificationResult, setVerificationResult] =
    useState<TicketVerificationResponse | null>(null);
  const [scannerPaused, setScannerPaused] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<VerifyTicketData>({
    resolver: zodResolver(verifyTicketSchema),
  });

  const verifyCode = async (ticketCode: string) => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const result = await ticketsAPI.verifyTicket(ticketCode);
      setVerificationResult(result);

      if (result.valid) {
        toast.success('Ticket is valid!');
      } else {
        toast.error(result.message || 'Invalid ticket');
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Failed to verify ticket');
      toast.error(message);
      setVerificationResult({
        valid: false,
        message,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const onSubmit = async (data: VerifyTicketData) => {
    await verifyCode(data.ticket_code);
  };

  const handleScan = async (ticketCode: string) => {
    if (isVerifying || scannerPaused) return;
    setScannerPaused(true);
    setValue('ticket_code', ticketCode);
    await verifyCode(ticketCode);
  };

  const handleCheckIn = async () => {
    const ticketCode = verificationResult?.ticket?.ticket_code;
    if (!ticketCode) return;

    setIsCheckingIn(true);
    try {
      const result = await ticketsAPI.checkinTicket(ticketCode);
      toast.success('Ticket checked in!');
      setVerificationResult((prev) =>
        prev ? { ...prev, ticket: result.ticket, can_check_in: false } : prev
      );
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Failed to check in ticket');
      toast.error(message);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleReset = () => {
    reset();
    setVerificationResult(null);
    setScannerPaused(false);
  };

  return (
    <div className="space-y-6">
      {/* Verification Form */}
      <Card className="p-6">
        <Tabs defaultValue="scan" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scan">
              <Camera className="w-4 h-4 mr-2" />
              Scan QR
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Keyboard className="w-4 h-4 mr-2" />
              Enter Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-3 pt-4">
            <QRScanner onScan={handleScan} paused={scannerPaused || isVerifying} />
            {scannerPaused && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setScannerPaused(false)}
              >
                Scan Another Ticket
              </Button>
            )}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                Point the camera at the ticket&apos;s QR code. It will verify
                automatically as soon as it&apos;s detected.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="pt-4">
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
                  Use this if the QR is damaged or the camera is unavailable.
                </p>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Verification Result */}
      {verificationResult && (
        <Card
          className={`p-6 border-2 ${
            verificationResult.valid ? 'border-green-500' : 'border-red-500'
          }`}
        >
          <div className="space-y-4">
            {/* Status Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-4">
                {verificationResult.valid ? (
                  <>
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                      <CheckCircle2 className="w-9 h-9 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-green-600">
                        Valid Ticket
                      </h3>
                      <p className="text-sm text-gray-600">
                        This ticket is authentic and active
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
                      <XCircle className="w-9 h-9 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-red-600">
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
                {verificationResult.ticket.event && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Event Details
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-gray-500 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {verificationResult.ticket.event.title}
                          </p>
                          <p className="text-sm text-gray-600">
                            {format(
                              new Date(verificationResult.ticket.event.start_datetime),
                              'PPP p'
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <p className="text-sm text-gray-600">
                          {verificationResult.ticket.event.venue}
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
                  verificationResult.ticket.checked_in_at && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-900">
                        <strong>Already Checked In:</strong> This ticket was used
                        on{' '}
                        {format(
                          new Date(verificationResult.ticket.checked_in_at),
                          'PPP p'
                        )}
                      </p>
                    </div>
                  )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              {verificationResult.can_check_in && (
                <Button
                  onClick={handleCheckIn}
                  disabled={isCheckingIn}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isCheckingIn ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Checking In...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Check In Ticket
                    </>
                  )}
                </Button>
              )}
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
