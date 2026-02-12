import { useMutation } from '@tanstack/react-query';
import { paymentsAPI, CreateStripePaymentIntentRequest } from '@/lib/api/endpoints/payments';
import { toast } from 'react-hot-toast';

/**
 * Hook to create Stripe Payment Intent
 */
export function useCreateStripePaymentIntent() {
  return useMutation({
    mutationFn: (data: CreateStripePaymentIntentRequest) => paymentsAPI.createStripePaymentIntent(data),
    onSuccess: () => {
      toast.success('Payment initialized');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to initialize payment';
      toast.error(message);
    },
  });
}
