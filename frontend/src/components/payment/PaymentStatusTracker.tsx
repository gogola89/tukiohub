'use client';

import { useEffect, useState } from 'react';
import { usePaymentStatus } from '@/lib/hooks/usePayment';
import { Loader2, CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PaymentStatusTrackerProps {
  transactionReference: string;
  bookingReference?: string;
  onSuccess: (data: any) => void;
  onFailure: (data: any) => void;
  onRetry?: () => void;
}

export default function PaymentStatusTracker({
  transactionReference,
  bookingReference,
  onSuccess,
  onFailure,
  onRetry,
}: PaymentStatusTrackerProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [shouldShowFailure, setShouldShowFailure] = useState(false);
  const [hasCalledSuccess, setHasCalledSuccess] = useState(false); // Prevent multiple success callbacks
  const MAX_WAIT_TIME = 120; // 120 seconds = 2 minutes (enough time for user to enter PIN)

  // Polling will continue until payment is COMPLETED or timeout is reached
  const { data: paymentStatus, isLoading, refetch } = usePaymentStatus(
    transactionReference,
    true,
    5000,
    () => elapsedTime >= MAX_WAIT_TIME // Stop polling only after timeout
  );

  // Track elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle payment status changes
  useEffect(() => {
    if (paymentStatus) {
      // Debug: Log every status check
      console.log('[PaymentStatusTracker] Status update:', {
        status: paymentStatus.status,
        transaction_reference: paymentStatus.transaction_reference,
        elapsed_time: elapsedTime,
        mpesa_receipt: paymentStatus.mpesa_receipt_number,
      });

      if (paymentStatus.status === 'COMPLETED' && !hasCalledSuccess) {
        // Payment completed successfully! Call success callback only once
        console.log('[PaymentStatusTracker] Payment COMPLETED! Triggering success callback (one time)');
        setHasCalledSuccess(true);
        onSuccess(paymentStatus);
      }
    }
  }, [paymentStatus, onSuccess, elapsedTime, hasCalledSuccess]);

  // Handle timeout - only show failure after max wait time
  useEffect(() => {
    if (elapsedTime >= MAX_WAIT_TIME && paymentStatus?.status !== 'COMPLETED') {
      // Timeout reached and payment still not completed
      // The polling will stop now, and we can show the failure state
      setShouldShowFailure(true);
      if (paymentStatus) {
        onFailure(paymentStatus);
      }
    }
  }, [elapsedTime, paymentStatus, onFailure]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRefresh = () => {
    refetch();
  };

  const getStatusDisplay = () => {
    // PRIORITY 1: If payment is COMPLETED, always show success (highest priority)
    if (paymentStatus?.status === 'COMPLETED') {
      return {
        icon: <CheckCircle2 className="w-12 h-12 text-green-500" />,
        title: 'Payment successful!',
        description: paymentStatus.result_desc || 'Your payment has been received',
        color: 'text-green-500',
      };
    }

    // PRIORITY 2: Initial loading state
    if (isLoading && !paymentStatus) {
      return {
        icon: <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />,
        title: 'Initializing payment...',
        description: 'Please wait',
        color: 'text-blue-500',
      };
    }

    // PRIORITY 3: If backend says FAILED but we haven't reached max wait time, show as still processing
    if (paymentStatus?.status === 'FAILED' && !shouldShowFailure) {
      return {
        icon: <Clock className="w-12 h-12 text-yellow-500 animate-pulse" />,
        title: 'Still processing payment...',
        description: 'Please complete the M-Pesa prompt on your phone. We\'re still waiting for confirmation.',
        color: 'text-yellow-500',
      };
    }

    // PRIORITY 4: Other statuses
    switch (paymentStatus?.status) {
      case 'PENDING':
        return {
          icon: <Clock className="w-12 h-12 text-yellow-500 animate-pulse" />,
          title: 'Waiting for payment',
          description: 'Please check your phone for the M-Pesa prompt and enter your PIN',
          color: 'text-yellow-500',
        };
      case 'FAILED':
        return {
          icon: <XCircle className="w-12 h-12 text-red-500" />,
          title: 'Payment timeout',
          description: paymentStatus.result_desc || 'Payment was not completed within the time limit. If you completed the payment, please check your booking status.',
          color: 'text-red-500',
        };
      default:
        return {
          icon: <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />,
          title: 'Processing...',
          description: 'Please wait',
          color: 'text-blue-500',
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const remainingTime = MAX_WAIT_TIME - elapsedTime;

  return (
    <Card className="p-8">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="flex items-center justify-center">{statusDisplay.icon}</div>

        <div className="text-center space-y-2">
          <h2 className={`text-2xl font-bold ${statusDisplay.color}`}>
            {statusDisplay.title}
          </h2>
          <p className="text-gray-600 max-w-md">{statusDisplay.description}</p>
        </div>

        {/* Timer Display - show only when waiting */}
        {paymentStatus?.status !== 'COMPLETED' && !shouldShowFailure && (
          <div className="text-center">
            <p className="text-sm text-gray-500">Time elapsed</p>
            <p className="text-2xl font-mono font-bold text-gray-700">
              {formatTime(elapsedTime)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Will timeout in {formatTime(remainingTime)}
            </p>
          </div>
        )}

        {(paymentStatus?.status === 'PENDING' || (paymentStatus?.status === 'FAILED' && !shouldShowFailure)) && (
          <div className="w-full max-w-md">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-blue-900">
                M-Pesa Payment Instructions:
              </p>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Check your phone for the M-Pesa prompt</li>
                <li>Enter your M-Pesa PIN to complete payment</li>
                <li>You will receive a confirmation message</li>
                <li>Wait for payment confirmation (up to 2 minutes)</li>
              </ol>
            </div>
          </div>
        )}

        {/* Manual refresh button */}
        {!shouldShowFailure && paymentStatus?.status !== 'COMPLETED' && (
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Check Status Now
          </Button>
        )}

        {paymentStatus?.transaction_reference && (
          <div className="text-center">
            <p className="text-xs text-gray-500">Transaction Reference</p>
            <p className="text-sm font-mono font-semibold text-gray-700">
              {paymentStatus.transaction_reference}
            </p>
          </div>
        )}

        {paymentStatus?.mpesa_receipt_number && (
          <div className="text-center">
            <p className="text-xs text-gray-500">M-Pesa Receipt Number</p>
            <p className="text-sm font-mono font-semibold text-green-700">
              {paymentStatus.mpesa_receipt_number}
            </p>
          </div>
        )}

        {/* Timeout Actions - show when payment has timed out */}
        {shouldShowFailure && paymentStatus?.status !== 'COMPLETED' && (
          <div className="w-full max-w-md space-y-3">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-900">
                <strong>Did you complete the payment?</strong>
              </p>
              <p className="text-xs text-yellow-800 mt-1">
                If you entered your M-Pesa PIN and received a confirmation SMS, your payment may have been processed.
                Check your booking status to see if tickets were generated.
              </p>
            </div>

            <div className="flex gap-2">
              {bookingReference && (
                <Button
                  onClick={() => window.location.href = `/booking/${bookingReference}`}
                  variant="default"
                  className="flex-1"
                >
                  Check Booking Status
                </Button>
              )}
              {onRetry && (
                <Button
                  onClick={onRetry}
                  variant="outline"
                  className="flex-1"
                >
                  Retry Payment
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
