export interface Attendee {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  is_subscribed: boolean;
  wallet_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AttendeeRegistrationData {
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  password: string;
  password2: string;
  is_subscribed?: boolean;
}

export interface AttendeeLoginData {
  email: string;
  password: string;
}

export interface AttendeeAuthResponse {
  access: string;
  refresh: string;
  user: Attendee;  // Backend now returns "user" instead of "attendee"
  user_type: 'attendee';
}

export interface AttendeeProfileUpdate {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  is_subscribed?: boolean;
}

export interface WalletTransaction {
  id: string;
  attendee: string;
  transaction_type: 'DEPOSIT' | 'WITHDRAWAL' | 'BOOKING' | 'REFUND' | 'PROMO_CREDIT';
  amount: string;
  balance_after: string;
  description: string;
  reference: string;
  created_at: string;
}

export interface WalletData {
  wallet_balance: number;
  transactions: WalletTransaction[];
}

export interface AddFundsData {
  amount: number;
  phone_number?: string;
  description?: string;
}

export type PaymentMethod = 'MPESA' | 'CARD' | 'WALLET';

export interface Ticket {
  id: string;
  ticket_code: string;
  attendee_name: string;
  attendee_email: string;
  booking_reference: string;
  ticket_type: {
    id: string;
    name: string;
    price: string;
  };
  event: {
    id: string;
    title: string;
    slug: string;
    start_datetime: string;
    end_datetime: string;
    venue: string;
  };
  status: 'ACTIVE' | 'USED' | 'CANCELLED' | 'TRANSFERRED';
  checked_in_at: string | null;
  checked_in_by: string;
  qr_code_image: string | null;
  created_at: string;
}

export interface TicketsData {
  tickets: Ticket[];
  count: number;
}
