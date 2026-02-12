export interface Transaction {
  id: string;
  transaction_reference: string;
  event: {
    id: string;
    title: string;
  };
  booking?: {
    booking_reference: string;
  };
  amount: number;
  phone_number: string;
  payment_method: 'MPESA';
  status: TransactionStatus;
  mpesa_receipt_number?: string;
  mpesa_checkout_request_id?: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface InitiatePaymentData {
  event_id: string;
  phone_number: string;
  amount: number;
  account_reference: string;
  transaction_desc: string;
}

export interface PaymentStatusResponse {
  transaction_reference: string;
  status: TransactionStatus;
  mpesa_receipt_number?: string;
  error_message?: string;
}
