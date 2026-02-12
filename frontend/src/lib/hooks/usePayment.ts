import { useMutation, useQuery } from '@tanstack/react-query';
import { paymentsAPI, InitiatePaymentRequest } from '@/lib/api/endpoints/payments';
import { toast } from 'react-hot-toast';

/**
 * Hook to initiate M-Pesa payment
 */
export function useInitiatePayment() {
  return useMutation({
    mutationFn: (data: InitiatePaymentRequest) => paymentsAPI.initiatePayment(data),
    onSuccess: (data) => {
      toast.success(data.message || 'STK Push sent to your phone');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to initiate payment';
      toast.error(message);
    },
  });
}

/**
 * Hook to check payment status with polling
 * @param transactionReference - The transaction reference to check
 * @param enabled - Whether to enable polling (default: true)
 * @param refetchInterval - Polling interval in milliseconds (default: 4000ms / 4 seconds)
 * @param shouldStopPolling - Optional function to determine if polling should stop (e.g., based on timeout)
 */
export function usePaymentStatus(
  transactionReference: string | null,
  enabled: boolean = true,
  refetchInterval: number = 4000,
  shouldStopPolling?: () => boolean
) {
  console.log('[usePaymentStatus] Hook called with:', {
    transactionReference,
    enabled,
    refetchInterval,
    hasShouldStopPolling: !!shouldStopPolling
  });

  return useQuery({
    queryKey: ['payment-status', transactionReference],
    queryFn: () => {
      console.log('[usePaymentStatus] queryFn executing for:', transactionReference);
      return paymentsAPI.checkPaymentStatus(transactionReference!);
    },
    enabled: enabled && !!transactionReference,
    // CRITICAL: Disable all caching to ensure we always get fresh payment status
    staleTime: 0, // Data is immediately stale
    gcTime: 0, // Don't cache at all (formerly cacheTime in v4)
    refetchInterval: (query) => {
      // Stop polling only if:
      // 1. Payment is COMPLETED, OR
      // 2. External shouldStopPolling callback returns true (e.g., timeout reached)
      const data = query.state.data;

      console.log('[usePaymentStatus] refetchInterval callback called:', {
        currentStatus: data?.status,
        shouldStopPollingResult: shouldStopPolling ? shouldStopPolling() : 'N/A',
        willContinuePolling: !(data?.status === 'COMPLETED') && !(shouldStopPolling && shouldStopPolling())
      });

      if (data?.status === 'COMPLETED') {
        console.log('[usePaymentStatus] Stopping polling - Payment COMPLETED');
        return false;
      }

      // Check if external timeout has been reached
      if (shouldStopPolling && shouldStopPolling()) {
        console.log('[usePaymentStatus] Stopping polling - Timeout reached');
        return false;
      }

      // Continue polling even if status is FAILED
      // The backend might update from FAILED → COMPLETED after processing the callback
      console.log(`[usePaymentStatus] Continuing polling - will check again in ${refetchInterval}ms`);
      return refetchInterval;
    },
    refetchIntervalInBackground: true,
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
    retry: false,
  });
}
