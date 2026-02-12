import apiClient from '../client';

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
  status: 'ACTIVE' | 'USED' | 'TRANSFERRED' | 'CANCELLED';
  qr_code_data: string;
  created_at: string;
  used_at?: string;
  transferred_to?: string;
}

export interface TicketVerificationResponse {
  valid: boolean;
  ticket?: Ticket;
  message: string;
  event?: {
    id: string;
    title: string;
    start_datetime: string;
    venue_name: string;
  };
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
  checkinTicket: async (ticketCode: string) => {
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
