'use client';

import { useState, useEffect, useRef } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api/client';

interface WalletCardTopUpProps {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

// Stripe Elements form component
function StripePaymentForm({
  clientSecret,
  amount,
  onSuccess,
}: {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

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
        redirect: 'if_required',
      });

      if (error) {
        toast.error(error.message || 'Payment failed');
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded
        toast.success('Payment successful! Your wallet has been topped up.');
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast.error('An unexpected error occurred');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
      <div className="bg-gray-50 rounded-lg p-3 space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Top-up Amount:</span>
          <span className="text-xl font-bold text-blue-600">
            KES {amount.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <PaymentElement />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
        <p className="font-medium text-blue-900 text-xs">Secure Payment:</p>
        <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
          <li>Your card details are encrypted and secure</li>
          <li>Powered by Stripe - industry-leading security</li>
        </ul>
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full sticky bottom-0 shadow-lg z-10"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Processing...
          </>
        ) : (
          <>Pay KES {amount.toLocaleString()}</>
        )}
      </Button>
    </form>
  );
}

// Main component
export default function WalletCardTopUp({
  amount,
  onSuccess,
  onCancel,
}: WalletCardTopUpProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
        const response = await apiClient.post('/attendees/wallet/card-topup/', {
          amount,
        });

        if (response.data.client_secret) {
          setClientSecret(response.data.client_secret);

          // Load Stripe with publishable key
          const stripe = loadStripe(response.data.publishable_key);
          setStripePromise(stripe);
          initializedRef.current = true;
        }
      } catch (error: any) {
        console.error('Failed to initialize payment:', error);
        toast.error(error.response?.data?.error || 'Failed to initialize payment');
        initializingRef.current = false;
        onCancel();
      } finally {
        setIsLoading(false);
      }
    };

    initializePayment();
  }, [amount]);

  // Loading state
  if (isLoading || !clientSecret || !stripePromise) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-2 pb-3 border-b">
          <CreditCard className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Pay with Card</h3>
        </div>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-sm text-gray-600">Initializing payment...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2 pb-3 border-b">
        <CreditCard className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Pay with Card</h3>
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
          amount={amount}
          onSuccess={onSuccess}
        />
      </Elements>

      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        className="w-full"
      >
        Cancel
      </Button>
    </div>
  );
}
