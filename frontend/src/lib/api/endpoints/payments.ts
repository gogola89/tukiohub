import apiClient from '../client';

export interface InitiatePaymentRequest {
  event_id: string;
  phone_number: string;
  amount: number;
  account_reference: string;
  transaction_desc?: string;
  CallBackURL?: string;  // Daraja API v3.0 requires this exact case-sensitive parameter
}

export interface InitiatePaymentResponse {
  success: boolean;
  message: string;
  transaction_reference: string;
  checkout_request_id: string;
  customer_message: string;
}

export interface PaymentStatusResponse {
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  transaction_reference: string;
  amount?: number;
  phone_number?: string;
  result_desc?: string;
  mpesa_receipt_number?: string;
}

export interface CreateStripePaymentIntentRequest {
  event_id: string;
  amount: number;
  account_reference: string;
}

export interface CreateStripePaymentIntentResponse {
  success: boolean;
  transaction_reference: string;
  client_secret: string;
  payment_intent_id: string;
  publishable_key: string;
}

export const paymentsAPI = {
  /**
   * Initiate M-Pesa STK Push payment
   *
   * @param data - Payment initiation data
   * @param data.CallBackURL - URL where Safaricom will send payment callback (required by Daraja API v3.0)
   *                           Must be case-sensitive: "CallBackURL" not "callback_url"
   *                           Example: "https://yourdomain.com/api/payments/mpesa/callback/"
   */
  initiatePayment: async (data: InitiatePaymentRequest): Promise<InitiatePaymentResponse> => {
    const response = await apiClient.post('/payments/mpesa/initiate/', data);
    return response.data;
  },

  /**
   * Check payment status by transaction reference
   * Poll this endpoint to get real-time payment status
   */
  checkPaymentStatus: async (transactionReference: string): Promise<PaymentStatusResponse> => {
    console.log('[paymentsAPI] Fetching status for transaction:', transactionReference);

    // Use timestamp query parameter for cache-busting (no custom headers to avoid CORS issues)
    const response = await apiClient.get(`/payments/status/${transactionReference}/`, {
      params: {
        _t: Date.now(), // Cache-busting timestamp - makes each request unique
      },
    });

    console.log('[paymentsAPI] Received status response:', response.data);
    return response.data;
  },

  /**
   * Create Stripe Payment Intent
   */
  createStripePaymentIntent: async (data: CreateStripePaymentIntentRequest): Promise<CreateStripePaymentIntentResponse> => {
    const response = await apiClient.post('/payments/stripe/create-intent/', data);
    return response.data;
  },
};
