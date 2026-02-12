export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  detail?: string;
}

export interface AnalyticsQuickStats {
  total_events: number;
  active_events: number;
  total_bookings: number;
  total_revenue: number;
  total_attendees: number;
  upcoming_events: number;
}

export interface EventAnalytics {
  event_id: string;
  event_title: string;
  total_revenue: number;
  total_bookings: number;
  total_attendees: number;
  tickets_sold: number;
  tickets_available: number;
  capacity_percentage: number;
  ticket_type_breakdown: {
    ticket_type: string;
    quantity_sold: number;
    revenue: number;
  }[];
  promo_code_usage: {
    code: string;
    usage_count: number;
    discount_amount: number;
  }[];
}

export interface SalesTimelineData {
  period: string;
  bookings: number;
  revenue: number;
  tickets_sold: number;
}
