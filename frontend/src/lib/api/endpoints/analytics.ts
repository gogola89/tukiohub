import apiClient from '../client';

export interface DashboardStats {
  total_revenue: number;
  total_bookings: number;
  total_attendees: number;
  upcoming_events_count: number;
  total_events: number;
  tickets_sold: number;
}

export interface EventAnalytics {
  event_id: string;
  event_title: string;
  event_status: string;
  start_datetime: string;

  // Booking metrics
  total_bookings: number;
  confirmed_bookings: number;
  pending_bookings: number;
  cancelled_bookings: number;

  // Ticket metrics
  total_tickets: number;
  tickets_sold: number;
  tickets_checked_in: number;
  check_in_rate: number;

  // Revenue metrics
  gross_revenue: number;
  net_revenue: number;
  total_revenue: number;
  total_discounts: number;

  // Frontend-compatible
  total_attendees: number;

  // Payment methods
  mpesa_revenue: number;
  card_revenue: number;

  // Breakdowns
  ticket_types: Record<string, { quantity: number; revenue: number; price: number }>;
  ticket_type_breakdown: {
    ticket_type: string;
    quantity_sold: number;
    revenue: number;
  }[];
  promo_codes: Record<string, { count: number; discount_total: number }>;

  // Capacity
  capacity: number;
  tickets_available: number | null;
  capacity_used_percent: number;
}

export interface SalesTimelineEntry {
  date: string;
  bookings: number;
  tickets: number;
  revenue: number;
}

export interface ReconciliationReport {
  event_id: string;
  event_title: string;
  generated_at: string;
  period_since: string | null;
  registrations_total: number;
  registrations_period: number;
  payments_by_method: {
    method: string;
    method_label: string;
    count: number;
    total: number;
  }[];
  payments_total: number;
  reconciliation: {
    is_clean: boolean;
    bookings_without_transaction_count: number;
    bookings_without_transaction: string[];
    transactions_without_booking_count: number;
    transactions_without_booking: string[];
  };
}

export const analyticsAPI = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get('/analytics/dashboard/');
    return response.data;
  },

  getQuickStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get('/analytics/quick-stats/');
    return response.data;
  },

  getEventAnalytics: async (eventId: string): Promise<EventAnalytics> => {
    const response = await apiClient.get(`/analytics/for-event/${eventId}/overview/`);
    return response.data;
  },

  getEventSalesTimeline: async (eventId: string): Promise<SalesTimelineEntry[]> => {
    const response = await apiClient.get(`/analytics/for-event/${eventId}/sales-timeline/`);
    return response.data;
  },

  getAggregateSalesTimeline: async (period: number = 30): Promise<SalesTimelineEntry[]> => {
    const response = await apiClient.get(`/analytics/aggregate/sales-timeline/?period=${period}`);
    return response.data;
  },

  getAggregateTicketBreakdown: async (): Promise<{ ticket_type: string; quantity_sold: number; revenue: number }[]> => {
    const response = await apiClient.get('/analytics/aggregate/ticket-breakdown/');
    return response.data;
  },

  getEventDemographics: async (eventId: string) => {
    const response = await apiClient.get(`/analytics/for-event/${eventId}/demographics/`);
    return response.data;
  },

  exportAttendees: async (eventId: string): Promise<Blob> => {
    const response = await apiClient.get(`/analytics/for-event/${eventId}/export/attendees/`, {
      responseType: 'blob',
    });
    return response.data;
  },

  exportSales: async (eventId: string): Promise<Blob> => {
    const response = await apiClient.get(`/analytics/for-event/${eventId}/export/sales/`, {
      responseType: 'blob',
    });
    return response.data;
  },

  getReconciliationReport: async (eventId: string): Promise<ReconciliationReport> => {
    const response = await apiClient.get(`/analytics/for-event/${eventId}/reconciliation/`);
    return response.data;
  },
};
