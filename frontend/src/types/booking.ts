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
  notes?: string;
  tickets: Ticket[];
  booking_items: BookingItem[];
  addon_items: AddonItem[];
  created_at: string;
  expires_at: string;
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface Ticket {
  id: string;
  ticket_code: string;
  ticket_type: {
    id: string;
    name: string;
    price: number;
  };
  attendee_name: string;
  attendee_email: string;
  status: TicketStatus;
  checked_in: boolean;
  checked_in_at?: string;
  qr_code: string;
  qr_code_data: string;  // Required by TicketCard component
  created_at: string;
  used_at?: string;
  transferred_to?: string;
}

export type TicketStatus = 'ACTIVE' | 'USED' | 'TRANSFERRED' | 'CANCELLED';

export interface BookingItem {
  id: string;
  ticket_type: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface AddonItem {
  id: string;
  addon: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
  unit_price: number;
  total_price: number;
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
  payment_method?: 'MPESA' | 'CARD' | 'WALLET';  // Optional: payment method selection
}
