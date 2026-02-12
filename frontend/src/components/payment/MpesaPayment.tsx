'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { initiatePaymentSchema, InitiatePaymentData } from '@/lib/validations/payment';
import { useInitiatePayment } from '@/lib/hooks/usePayment';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import PaymentStatusTracker from './PaymentStatusTracker';
import { Smartphone, Phone } from 'lucide-react';
import Image from 'next/image';
import { formatPhoneForBackend } from '@/lib/utils/phone';

interface MpesaPaymentProps {
  bookingReference: string;
  amount: number;
  eventId: string;
  eventTitle?: string;
  onSuccess?: () => void;
}

export default function MpesaPayment({
  bookingReference,
  amount,
  eventId,
  eventTitle,
  onSuccess,
}: MpesaPaymentProps) {
  const router = useRouter();
  const [transactionReference, setTransactionReference] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const initiatePayment = useInitiatePayment();

  const handleInitiatePayment = async () => {
    // Validate phone number first (with + prefix from react-phone-number-input)
    const validation = initiatePaymentSchema.safeParse({
      phone_number: phoneNumber,
      amount,
      account_reference: bookingReference,
    });

    if (!validation.success) {
      const phoneError = validation.error.issues.find((e) => e.path.includes('phone_number'));
      setPhoneError(phoneError?.message || 'Invalid phone number');
      return;
    }

    setPhoneError('');

    // Format phone number for backend (remove + prefix) after validation passes
    const formattedPhone = formatPhoneForBackend(phoneNumber);

    try {
      // Construct CallBackURL - Daraja API v3.0 requires this exact parameter name (case-sensitive)
      // The backend will pass this to Safaricom when initiating STK Push
      const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
      const callbackUrl = `${apiUrl.replace('/api', '')}/api/payments/mpesa/callback/`;

      const result = await initiatePayment.mutateAsync({
        event_id: eventId,
        phone_number: formattedPhone,
        amount,
        account_reference: bookingReference,
        transaction_desc: eventTitle ? `${eventTitle} Tickets` : 'Event Tickets',
        CallBackURL: callbackUrl,
      });

      console.log('[MpesaPayment] Payment initiation result:', result);

      if (result.success && result.transaction_reference) {
        console.log('[MpesaPayment] Setting transaction reference:', result.transaction_reference);
        setTransactionReference(result.transaction_reference);
      } else {
        console.error('[MpesaPayment] No transaction reference in response!', result);
      }
    } catch (error) {
      console.error('Payment initiation failed:', error);
    }
  };

  const handlePaymentSuccess = (data: any) => {
    console.log('[MpesaPayment] Payment success handler called with:', data);
    console.log('[MpesaPayment] Will redirect to confirmation page in 2 seconds...');

    setTimeout(() => {
      if (onSuccess) {
        console.log('[MpesaPayment] Calling onSuccess callback');
        onSuccess();
      } else {
        const redirectUrl = `/booking/${bookingReference}/confirmation`;
        console.log('[MpesaPayment] Redirecting to:', redirectUrl);
        router.push(redirectUrl);
      }
    }, 2000);
  };

  const handlePaymentFailure = (data: any) => {
    // Don't automatically reset - user should manually decide to retry
    // They might have completed the payment, so give them option to check booking
  };

  const handleRetry = () => {
    setTransactionReference(null);
    setPhoneNumber('');
  };

  // If payment has been initiated, show status tracker
  if (transactionReference) {
    return (
      <PaymentStatusTracker
        transactionReference={transactionReference}
        bookingReference={bookingReference}
        onSuccess={handlePaymentSuccess}
        onFailure={handlePaymentFailure}
        onRetry={handleRetry}
      />
    );
  }

  // Show payment initiation form
  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-center gap-3 pb-4 border-b">
        <Smartphone className="w-6 h-6 text-green-600" />
        <h2 className="text-2xl font-bold">Pay with M-Pesa</h2>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Booking Reference:</span>
            <span className="font-mono font-semibold">{bookingReference}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Amount to Pay:</span>
            <span className="text-2xl font-bold text-green-600">
              KES {amount.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone-number" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            M-Pesa Phone Number
          </Label>
          <PhoneInput
            id="phone-number"
            value={phoneNumber}
            onChange={(value) => setPhoneNumber(value || '')}
            placeholder="712 345 678"
            error={!!phoneError}
            disabled={initiatePayment.isPending}
          />
          {phoneError && <p className="text-sm text-destructive">{phoneError}</p>}
          <p className="text-xs text-muted-foreground">
            Enter your M-Pesa registered phone number
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <p className="font-medium text-blue-900 text-sm">How it works:</p>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Enter your M-Pesa registered phone number</li>
            <li>Click "Pay Now" to initiate payment</li>
            <li>You will receive an M-Pesa prompt on your phone</li>
            <li>Enter your M-Pesa PIN to complete the payment</li>
            <li>Wait for confirmation</li>
          </ol>
        </div>

        <Button
          onClick={handleInitiatePayment}
          disabled={initiatePayment.isPending || !phoneNumber || phoneNumber.length < 12}
          className="w-full h-12 text-lg"
          size="lg"
        >
          {initiatePayment.isPending ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Processing...
            </>
          ) : (
            <>Pay KES {amount.toLocaleString()}</>
          )}
        </Button>

        <p className="text-xs text-center text-gray-500">
          You will receive an STK push notification on your phone. Please have your M-Pesa PIN ready.
        </p>
      </div>
    </Card>
  );
}
