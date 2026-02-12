'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCreateStripePaymentIntent } from '@/lib/hooks/useStripePayment';
import { usePaymentStatus } from '@/lib/hooks/usePayment';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PaymentStatusTracker from './PaymentStatusTracker';

interface StripePaymentProps {
  bookingReference: string;
  amount: number;
  eventId: string;
  eventTitle?: string;
  onSuccess?: () => void;
}

// Stripe Elements form component (needs to be separate to use Stripe hooks)
function StripePaymentForm({
  clientSecret,
  transactionReference,
  bookingReference,
  amount,
  onSuccess,
}: {
  clientSecret: string;
  transactionReference: string;
  bookingReference: string;
  amount: number;
  onSuccess?: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking/${bookingReference}/confirmation`,
        },
        redirect: 'if_required', // Handle success in same page if no 3D Secure
      });

      if (error) {
        toast.error(error.message || 'Payment failed');
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded without redirect (no 3D Secure)
        toast.success('Payment successful!');
        setPaymentCompleted(true);

        // Wait a moment for webhook to process, then redirect
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            router.push(`/booking/${bookingReference}/confirmation`);
          }
        }, 2000);
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast.error('An unexpected error occurred');
      setIsProcessing(false);
    }
  };

  if (paymentCompleted) {
    return (
      <PaymentStatusTracker
        transactionReference={transactionReference}
        bookingReference={bookingReference}
        onSuccess={onSuccess || (() => router.push(`/booking/${bookingReference}/confirmation`))}
        onFailure={() => {}}
        onRetry={() => setPaymentCompleted(false)}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Booking Reference:</span>
          <span className="font-mono font-semibold">{bookingReference}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Amount to Pay:</span>
          <span className="text-2xl font-bold text-blue-600">
            KES {amount.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <PaymentElement />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
        <p className="font-medium text-blue-900 text-sm">Secure Payment:</p>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Your card details are encrypted and secure</li>
          <li>Powered by Stripe - industry-leading security</li>
          <li>We never store your full card information</li>
        </ul>
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full h-12 text-lg sticky bottom-0 shadow-lg z-10"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Processing...
          </>
        ) : (
          <>Pay KES {amount.toLocaleString()}</>
        )}
      </Button>

      <p className="text-xs text-center text-gray-500">
        You may be asked to verify your payment with your bank (3D Secure).
      </p>
    </form>
  );
}

// Main component
export default function StripePayment({
  bookingReference,
  amount,
  eventId,
  eventTitle,
  onSuccess,
}: StripePaymentProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [transactionReference, setTransactionReference] = useState<string | null>(null);
  const createPaymentIntent = useCreateStripePaymentIntent();
  const initializingRef = useRef(false);
  const initializedRef = useRef(false);

  // Initialize payment intent on mount
  useEffect(() => {
    // Prevent duplicate initialization (especially in React Strict Mode)
    if (initializingRef.current || initializedRef.current) {
      return;
    }

    const initializePayment = async () => {
      initializingRef.current = true;

      try {
        const result = await createPaymentIntent.mutateAsync({
          event_id: eventId,
          amount,
          account_reference: bookingReference,
        });

        if (result.success && result.client_secret) {
          setClientSecret(result.client_secret);
          setTransactionReference(result.transaction_reference);

          // Load Stripe with publishable key
          const stripe = loadStripe(result.publishable_key);
          setStripePromise(stripe);
          initializedRef.current = true;
        }
      } catch (error) {
        console.error('Failed to initialize payment:', error);
        // Reset on error to allow retry
        initializingRef.current = false;
      }
    };

    initializePayment();
  }, [bookingReference, amount, eventId]);

  // Loading state
  if (!clientSecret || !stripePromise || !transactionReference) {
    return (
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-center gap-3 pb-4 border-b">
          <CreditCard className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Pay with Card</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Initializing payment...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-center gap-3 pb-4 border-b">
        <CreditCard className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Pay with Card</h2>
      </div>

      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#2563eb',
            },
          },
        }}
      >
        <StripePaymentForm
          clientSecret={clientSecret}
          transactionReference={transactionReference}
          bookingReference={bookingReference}
          amount={amount}
          onSuccess={onSuccess}
        />
      </Elements>
    </Card>
  );
}
