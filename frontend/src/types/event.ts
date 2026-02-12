export interface Event {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: EventCategory;
  start_datetime: string;
  end_datetime: string;
  venue_name: string;
  venue_address: string;
  latitude?: number;
  longitude?: number;
  is_online: boolean;
  online_url?: string;
  capacity: number;
  status: EventStatus;
  is_free?: boolean;
  age_restriction?: number;
  featured_image?: string;
  image?: string;
  images?: EventImage[];
  organizer: {
    id: string;
    company_name: string;
    profile_image?: string;
  };
  tickets_sold: number;
  revenue: number;
  min_price?: number;
  max_price?: number;
  ticket_types?: TicketType[];
  promo_codes?: PromoCode[];
  addons?: EventAddon[];
  is_sold_out?: boolean;
  available_tickets?: number;
  created_at: string;
  updated_at: string;
}

export interface EventImage {
  id: string;
  event?: string;
  image: string;
  image_url?: string;
  order?: number;
  is_primary?: boolean;
  created_at?: string;
}

export type EventCategory =
  | 'MUSIC'
  | 'SPORTS'
  | 'BUSINESS'
  | 'ENTERTAINMENT'
  | 'CONFERENCE'
  | 'WORKSHOP'
  | 'FESTIVAL'
  | 'CHARITY'
  | 'NETWORKING'
  | 'OTHER';

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';

export interface TicketType {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity_available: number;
  quantity_sold: number;
  sales_start_date: string;
  sales_end_date: string;
  min_purchase: number;
  max_purchase: number;
  is_active: boolean;
  created_at: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  valid_from: string;
  valid_until: string;
  usage_limit: number | null;
  usage_count: number;
  min_purchase_amount?: number;
  is_active: boolean;
  created_at: string;
}

export interface EventAddon {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity_available: number;
  quantity_sold: number;
  is_required: boolean;
  created_at: string;
}

export interface EventListParams {
  page?: number;
  page_size?: number;
  category?: EventCategory;
  city?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
}
