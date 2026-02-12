'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { bookingsAPI } from '@/lib/api/endpoints/bookings';
import MpesaPayment from '@/components/payment/MpesaPayment';
import StripePayment from '@/components/payment/StripePayment';
import { Card } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const bookingReference = searchParams.get('booking_reference');
  const amountParam = searchParams.get('amount');
  const paymentMethod = searchParams.get('payment_method') || 'MPESA';

  // Always fetch booking details to get event_id for payment
  const { data: booking, isLoading: isLoadingBooking } = useQuery({
    queryKey: ['booking', bookingReference],
    queryFn: () => bookingsAPI.getBooking(bookingReference!),
    enabled: !!bookingReference,
  });

  const amount = amountParam ? parseFloat(amountParam) : booking?.final_amount || booking?.total_amount || 0;
  const eventId = booking?.event?.id;

  useEffect(() => {
    // If no booking reference, redirect to events
    if (!bookingReference) {
      router.push('/events');
    }
  }, [bookingReference, router]);

  // Loading state while fetching booking
  if (isLoadingBooking) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!bookingReference || !amount || !eventId) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="p-8 max-w-md mx-auto text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
          <h2 className="text-xl font-semibold">Invalid Payment Request</h2>
          <p className="text-gray-600">Missing booking reference or amount information.</p>
          <Link href="/events">
            <Button>Browse Events</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Complete Your Payment</h1>
        <p className="text-gray-600">
          Secure payment powered by {paymentMethod === 'CARD' ? 'Stripe' : 'M-Pesa'}. Your booking will be confirmed once payment is received.
        </p>
      </div>

      {paymentMethod === 'CARD' ? (
        <StripePayment
          bookingReference={bookingReference}
          amount={amount}
          eventId={eventId}
          eventTitle={booking?.event?.title}
        />
      ) : (
        <MpesaPayment
          bookingReference={bookingReference}
          amount={amount}
          eventId={eventId}
          eventTitle={booking?.event?.title}
        />
      )}

      <div className="mt-8 text-center space-y-2">
        <p className="text-sm text-gray-500">
          By completing this payment, you agree to our terms and conditions.
        </p>
        <Link href="/events" className="text-sm text-blue-600 hover:underline block">
          Cancel and return to events
        </Link>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
