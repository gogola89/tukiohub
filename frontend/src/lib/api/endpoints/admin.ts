import apiClient from '../client';

export interface AdminDashboardStats {
  total_organizers: number;
  pending_organizers: number;
  total_events: number;
  total_revenue: number;
}

export interface Organizer {
  id: string;
  email: string;
  company_name: string;
  phone_number: string;
  verification_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  verification_documents: string[];
  created_at: string;
  updated_at: string;
}

export interface AdminOrganizerDetails {
  id: string;
  email: string;
  company_name: string;
  phone_number: string;
  verification_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  verification_documents: string[];
  created_at: string;
  updated_at: string;
  events: Array<{
    id: string;
    title: string;
    start_datetime: string;
    end_datetime: string;
    status: string;
    tickets_sold: number;
    revenue: number;
  }>;
}

export interface PlatformAnalytics {
  total_organizers: number;
  total_events: number;
  total_revenue: number;
  total_tickets_sold: number;
}

export interface AdminEvent {
  id: string;
  title: string;
  organizer: {
    id: string;
    company_name: string;
    profile_image?: string;
  };
  date: string;
  status: 'PUBLISHED' | 'DRAFT' | 'COMPLETED' | 'CANCELLED';
  tickets_sold: number;
  revenue: number;
}

export const adminAPI = {
  getDashboardStats: async (): Promise<AdminDashboardStats> => {
    const response = await apiClient.get('/admin/dashboard/');
    return response.data;
  },

  getOrganizers: async (): Promise<Organizer[]> => {
    const response = await apiClient.get('/admin/organizers/');
    return response.data;
  },

  getOrganizerDetails: async (organizerId: string): Promise<AdminOrganizerDetails> => {
    const response = await apiClient.get(`/admin/organizers/${organizerId}/`);
    return response.data;
  },

  approveRejectOrganizer: async (organizerId: string, status: 'APPROVED' | 'REJECTED', reason?: string) => {
    const response = await apiClient.post(`/admin/organizers/${organizerId}/approve-reject/`, {
      status,
      reason
    });
    return response.data;
  },

  getPlatformAnalytics: async (): Promise<PlatformAnalytics> => {
    const response = await apiClient.get('/admin/analytics/');
    return response.data;
  },

  getEvents: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
    search?: string;
  }): Promise<{ count: number; next: string | null; previous: string | null; results: AdminEvent[] }> => {
    const response = await apiClient.get('/admin/events/', { params });
    return response.data;
  },
};