'use client';

import { XCircle, AlertCircle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

interface PaymentFailedProps {
  bookingReference: string;
  amount: number;
  errorMessage?: string;
  transactionReference?: string;
  onRetry?: () => void;
}

export default function PaymentFailed({
  bookingReference,
  amount,
  errorMessage,
  transactionReference,
  onRetry,
}: PaymentFailedProps) {
  const commonErrors = [
    {
      keyword: 'insufficient',
      title: 'Insufficient Funds',
      description: 'Your M-Pesa account does not have enough balance. Please top up and try again.',
    },
    {
      keyword: 'cancel',
      title: 'Payment Cancelled',
      description: 'You cancelled the payment request. You can try again when ready.',
    },
    {
      keyword: 'timeout',
      title: 'Payment Timeout',
      description: 'The payment request timed out. Please try again and enter your PIN promptly.',
    },
    {
      keyword: 'wrong pin',
      title: 'Incorrect PIN',
      description: 'The PIN entered was incorrect. Please try again with the correct PIN.',
    },
  ];

  const errorDetails = commonErrors.find((error) =>
    errorMessage?.toLowerCase().includes(error.keyword)
  ) || {
    title: 'Payment Failed',
    description: errorMessage || 'We could not process your payment. Please try again.',
  };

  return (
    <Card className="p-8 max-w-2xl mx-auto">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
          <XCircle className="w-12 h-12 text-red-600" />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-red-600">{errorDetails.title}</h1>
          <p className="text-lg text-gray-600">{errorDetails.description}</p>
        </div>

        <div className="w-full bg-gray-50 rounded-lg p-6 space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Booking Reference</span>
            <span className="font-mono font-semibold">{bookingReference}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Amount</span>
            <span className="font-semibold">KES {amount.toLocaleString()}</span>
          </div>

          {transactionReference && (
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Transaction Reference</span>
              <span className="font-mono text-sm">{transactionReference}</span>
            </div>
          )}
        </div>

        <div className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="space-y-2">
              <p className="font-medium text-yellow-900">Your booking is still active</p>
              <p className="text-sm text-yellow-800">
                Your booking ({bookingReference}) is reserved for 5 minutes. Please complete the payment before it expires.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full space-y-3">
          {onRetry && (
            <Button onClick={onRetry} className="w-full h-12" size="lg">
              <RefreshCcw className="w-5 h-5 mr-2" />
              Retry Payment
            </Button>
          )}

          <Link href="/events" className="block">
            <Button variant="outline" className="w-full h-12" size="lg">
              <Home className="w-5 h-5 mr-2" />
              Back to Events
            </Button>
          </Link>
        </div>

        <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900 mb-2">Common issues:</p>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Ensure you have sufficient M-Pesa balance</li>
            <li>Enter your PIN within 60 seconds of receiving the prompt</li>
            <li>Check that your phone number is correct</li>
            <li>Make sure you have network connectivity</li>
          </ul>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Need help? Contact our support team</p>
        </div>
      </div>
    </Card>
  );
}
