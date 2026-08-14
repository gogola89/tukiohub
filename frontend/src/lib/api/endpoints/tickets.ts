import apiClient from '../client';

export interface Ticket {
  id: string;
  ticket_code: string;
  ticket_type: {
    id: string;
    name: string;
    price: number;
  };
  event?: {
    id: string;
    title: string;
    slug: string;
    start_datetime: string;
    end_datetime: string;
    venue: string;
  };
  attendee_name: string;
  attendee_email: string;
  status: 'ACTIVE' | 'USED' | 'TRANSFERRED' | 'CANCELLED';
  booking_reference?: string;
  qr_code_image?: string;
  created_at: string;
  checked_in_at?: string;
  checked_in_by?: string;
}

export interface TicketVerificationResponse {
  valid: boolean;
  message: string;
  ticket?: Ticket;
  can_check_in?: boolean;
}

export interface TicketCheckInResponse {
  message: string;
  ticket: Ticket;
}

export interface TransferTicketRequest {
  new_attendee_name: string;
  new_attendee_email: string;
  new_attendee_phone: string;
}

export const ticketsAPI = {
  /**
   * Verify a ticket by ticket code
   */
  verifyTicket: async (ticketCode: string): Promise<TicketVerificationResponse> => {
    const response = await apiClient.post('/bookings/tickets/verify/', {
      ticket_code: ticketCode,
    });
    return response.data;
  },

  /**
   * Check in a ticket (mark as used)
   * Requires authentication
   */
  checkinTicket: async (ticketCode: string): Promise<TicketCheckInResponse> => {
    const response = await apiClient.put(`/bookings/tickets/${ticketCode}/checkin/`);
    return response.data;
  },

  /**
   * Transfer a ticket to another person
   */
  transferTicket: async (ticketCode: string, data: TransferTicketRequest) => {
    const response = await apiClient.post(`/bookings/tickets/${ticketCode}/transfer/`, data);
    return response.data;
  },

  /**
   * Download ticket as PDF
   */
  downloadTicket: async (ticketCode: string): Promise<Blob> => {
    const response = await apiClient.get(`/bookings/tickets/${ticketCode}/download/`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
