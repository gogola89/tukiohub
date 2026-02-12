'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { bookingsAPI } from '@/lib/api/endpoints/bookings';
import PaymentSuccess from '@/components/payment/PaymentSuccess';
import { Loader2, RefreshCcw, AlertCircle, Clock } from 'lucide-react';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

function ConfirmationContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const bookingReference = params.reference as string;

  // Get payment details from query params if available
  const mpesaReceipt = searchParams.get('mpesa_receipt');
  const transactionRef = searchParams.get('transaction_ref');

  const { data: booking, isLoading, error, refetch } = useQuery({
    queryKey: ['booking', bookingReference],
    queryFn: () => bookingsAPI.getBooking(bookingReference),
    enabled: !!bookingReference,
    refetchInterval: (query) => {
      // Keep polling if booking is confirmed but no tickets yet
      const data = query.state.data;
      if (data?.status === 'CONFIRMED' && (!data.tickets || data.tickets.length === 0)) {
        return 3000; // Poll every 3 seconds
      }
      return false; // Stop polling
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Loading your booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center space-y-4">
          <h2 className="text-2xl font-bold text-red-600">Booking Not Found</h2>
          <p className="text-gray-600">
            We couldn't find a booking with reference {bookingReference}
          </p>
        </div>
      </div>
    );
  }

  // Check if payment succeeded but tickets not generated yet
  const hasTickets = booking.tickets && booking.tickets.length > 0;
  const isConfirmed = booking.status === 'CONFIRMED';
  const isPending = booking.status === 'PENDING';
  const isCancelled = booking.status === 'CANCELLED';

  // If confirmed but no tickets, show waiting message
  if (isConfirmed && !hasTickets) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 max-w-2xl mx-auto text-center space-y-6">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
            <Clock className="w-12 h-12 text-yellow-600 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-yellow-600">Generating Your Tickets</h1>
            <p className="text-lg text-gray-600">
              Your payment has been confirmed! We're generating your tickets now.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              This usually takes a few seconds. Your page will update automatically.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600">Booking Reference:</p>
            <p className="text-xl font-mono font-bold">{bookingReference}</p>
          </div>

          <Button onClick={() => refetch()} variant="outline" className="gap-2">
            <RefreshCcw className="w-4 h-4" />
            Refresh Status
          </Button>

          <div className="text-xs text-gray-500">
            <p>Your tickets will be sent to your email once generated.</p>
            <p className="mt-2">Page auto-refreshes every 3 seconds</p>
          </div>
        </Card>
      </div>
    );
  }

  // If still pending after payment attempt, show issue message
  if (isPending) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 max-w-2xl mx-auto space-y-6">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-12 h-12 text-yellow-600" />
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-yellow-600">Payment Processing</h1>
            <p className="text-lg text-gray-600">
              We're still processing your payment
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
            <p className="font-medium text-yellow-900">What's happening?</p>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>Your M-Pesa payment may still be processing</li>
              <li>This can take up to 2-3 minutes</li>
              <li>You'll receive a confirmation SMS when complete</li>
            </ul>
          </div>

          <div className="space-y-2 text-center">
            <p className="text-sm text-gray-600">Booking Reference:</p>
            <p className="text-xl font-mono font-bold">{bookingReference}</p>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => refetch()} variant="outline" className="flex-1 gap-2">
              <RefreshCcw className="w-4 h-4" />
              Check Status
            </Button>
            <Link href={`/booking/${bookingReference}`} className="flex-1">
              <Button variant="secondary" className="w-full">
                View Booking Details
              </Button>
            </Link>
          </div>

          <div className="text-xs text-gray-500 text-center">
            <p>If you entered your M-Pesa PIN and received a confirmation SMS,</p>
            <p>your tickets will be generated shortly.</p>
          </div>
        </Card>
      </div>
    );
  }

  // If cancelled, show cancellation message
  if (isCancelled) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 max-w-2xl mx-auto text-center space-y-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-red-600">Booking Cancelled</h1>
            <p className="text-lg text-gray-600">
              This booking has been cancelled
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-900">
              The booking expired before payment was confirmed. This usually happens if payment wasn't completed within 5 minutes.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600">Booking Reference:</p>
            <p className="text-xl font-mono font-bold">{bookingReference}</p>
          </div>

          <Link href="/events">
            <Button className="w-full">Browse Events Again</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // If we have tickets, show success page
  return (
    <div className="container mx-auto px-4 py-8">
      <PaymentSuccess
        bookingReference={bookingReference}
        amount={booking.final_amount || booking.total_amount}
        mpesaReceiptNumber={mpesaReceipt || undefined}
        transactionReference={transactionRef || undefined}
      />

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="mt-6 p-4 max-w-2xl mx-auto">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify({
              status: booking.status,
              payment_status: booking.payment_status,
              tickets_count: booking.tickets?.length || 0,
              has_tickets: hasTickets,
            }, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
