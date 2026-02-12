'use client';

import { useEffect, useState } from 'react';
import { usePaymentStatus } from '@/lib/hooks/usePayment';
import { Loader2, CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface WalletTopUpTrackerProps {
  transactionReference: string;
  amount: number;
  onSuccess: () => void;
  onFailure: () => void;
  onRetry: () => void;
}

export default function WalletTopUpTracker({
  transactionReference,
  amount,
  onSuccess,
  onFailure,
  onRetry,
}: WalletTopUpTrackerProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [shouldShowFailure, setShouldShowFailure] = useState(false);
  const [hasCalledSuccess, setHasCalledSuccess] = useState(false);
  const MAX_WAIT_TIME = 120; // 2 minutes

  const { data: paymentStatus, isLoading, refetch } = usePaymentStatus(
    transactionReference,
    true,
    5000,
    () => elapsedTime >= MAX_WAIT_TIME
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
      console.log('[WalletTopUpTracker] Status update:', {
        status: paymentStatus.status,
        transaction_reference: paymentStatus.transaction_reference,
        elapsed_time: elapsedTime,
      });

      if (paymentStatus.status === 'COMPLETED' && !hasCalledSuccess) {
        console.log('[WalletTopUpTracker] Payment COMPLETED! Triggering success callback');
        setHasCalledSuccess(true);
        onSuccess();
      }
    }
  }, [paymentStatus, onSuccess, elapsedTime, hasCalledSuccess]);

  // Handle timeout
  useEffect(() => {
    if (elapsedTime >= MAX_WAIT_TIME && paymentStatus?.status !== 'COMPLETED') {
      setShouldShowFailure(true);
      onFailure();
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
    if (paymentStatus?.status === 'COMPLETED') {
      return {
        icon: <CheckCircle2 className="w-16 h-16 text-green-500" />,
        title: 'Top-up successful!',
        description: `KES ${amount.toLocaleString()} has been added to your wallet`,
        color: 'text-green-500',
      };
    }

    if (isLoading && !paymentStatus) {
      return {
        icon: <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />,
        title: 'Initializing payment...',
        description: 'Please wait',
        color: 'text-blue-500',
      };
    }

    if (paymentStatus?.status === 'FAILED' && !shouldShowFailure) {
      return {
        icon: <Clock className="w-16 h-16 text-yellow-500 animate-pulse" />,
        title: 'Still processing payment...',
        description: 'Please complete the M-Pesa prompt on your phone',
        color: 'text-yellow-500',
      };
    }

    switch (paymentStatus?.status) {
      case 'PENDING':
        return {
          icon: <Clock className="w-16 h-16 text-yellow-500 animate-pulse" />,
          title: 'Waiting for payment',
          description: 'Check your phone for the M-Pesa prompt and enter your PIN',
          color: 'text-yellow-500',
        };
      case 'FAILED':
        return {
          icon: <XCircle className="w-16 h-16 text-red-500" />,
          title: 'Payment timeout',
          description: paymentStatus.result_desc || 'Payment was not completed within the time limit',
          color: 'text-red-500',
        };
      default:
        return {
          icon: <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />,
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

        {/* Amount Display */}
        {paymentStatus?.status !== 'COMPLETED' && (
          <div className="text-center">
            <p className="text-sm text-gray-500">Top-up Amount</p>
            <p className="text-3xl font-bold text-primary">
              KES {amount.toLocaleString()}
            </p>
          </div>
        )}

        {/* Timer Display */}
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

        {/* Instructions */}
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
                <li>Your wallet will be credited automatically</li>
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

        {/* Transaction Reference */}
        {paymentStatus?.transaction_reference && (
          <div className="text-center">
            <p className="text-xs text-gray-500">Transaction Reference</p>
            <p className="text-sm font-mono font-semibold text-gray-700">
              {paymentStatus.transaction_reference}
            </p>
          </div>
        )}

        {/* M-Pesa Receipt */}
        {paymentStatus?.mpesa_receipt_number && (
          <div className="text-center">
            <p className="text-xs text-gray-500">M-Pesa Receipt Number</p>
            <p className="text-sm font-mono font-semibold text-green-700">
              {paymentStatus.mpesa_receipt_number}
            </p>
          </div>
        )}

        {/* Timeout Actions */}
        {shouldShowFailure && paymentStatus?.status !== 'COMPLETED' && (
          <div className="w-full max-w-md space-y-3">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-900">
                <strong>Did you complete the payment?</strong>
              </p>
              <p className="text-xs text-yellow-800 mt-1">
                If you entered your M-Pesa PIN and received a confirmation SMS,
                the money may still be added to your wallet. Check your transaction history.
              </p>
            </div>

            <Button
              onClick={onRetry}
              variant="default"
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Success Action */}
        {paymentStatus?.status === 'COMPLETED' && (
          <Button
            onClick={onSuccess}
            variant="default"
            className="w-full max-w-md"
          >
            Done
          </Button>
        )}
      </div>
    </Card>
  );
}
