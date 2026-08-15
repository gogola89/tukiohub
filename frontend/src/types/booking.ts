import { Ticket } from '@/lib/api/endpoints/tickets';

export interface Booking {
  id: string;
  booking_reference: string;
  event: {
    id: string;
    title: string;
    start_datetime: string;
    venue_name: string;
  };
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  promo_code?: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  payment_method?: 'MPESA' | 'CARD' | 'WALLET' | 'CASH';
  notes?: string;
  tickets: Ticket[];
  items: BookingItem[];
  addon_items: AddonItem[];
  created_at: string;
  expires_at: string;
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export type { Ticket };

export interface BookingItem {
  id: string;
  ticket_type: string;
  ticket_type_name: string;
  quantity: number;
  price_per_ticket: number;
  subtotal: number;
}

export interface AddonItem {
  id: string;
  addon: string;
  addon_name: string;
  quantity: number;
  price_per_item: number;
  subtotal: number;
}

export interface CreateBookingData {
  event_id: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string;
  items: {
    ticket_type_id: string;
    quantity: number;
  }[];
  addons?: {
    addon_id: string;
    quantity: number;
  }[];
  promo_code?: string;
  notes?: string;
  attendee_id?: string;  // Optional: for registered attendees
  payment_method?: 'MPESA' | 'CARD' | 'WALLET' | 'CASH';  // Optional: payment method selection
}
