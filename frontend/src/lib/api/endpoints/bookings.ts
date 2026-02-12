import apiClient from '../client';
import { Booking, CreateBookingData } from '@/types/booking';

export const bookingsAPI = {
  // Create a new booking (guest checkout)
  createBooking: async (data: CreateBookingData): Promise<Booking> => {
    const response = await apiClient.post('/bookings/create/', data);
    return response.data;
  },

  // Get booking by reference
  getBooking: async (bookingReference: string): Promise<Booking> => {
    const response = await apiClient.get(`/bookings/${bookingReference}/`);
    return response.data;
  },

  // Cancel booking
  cancelBooking: async (bookingReference: string): Promise<void> => {
    const response = await apiClient.post(`/bookings/${bookingReference}/cancel/`);
    return response.data;
  },

  // Validate promo code
  validatePromoCode: async (eventId: string, promoCode: string, attendeeEmail?: string) => {
    const response = await apiClient.post(`/events/${eventId}/promo-codes/validate/`, {
      code: promoCode,
      attendee_email: attendeeEmail,
    });
    return response.data;
  },

  // Confirm wallet payment for booking
  confirmWalletPayment: async (bookingReference: string): Promise<{
    message: string;
    booking: Booking;
    tickets_generated: number;
  }> => {
    const response = await apiClient.post(`/bookings/${bookingReference}/confirm-wallet-payment/`);
    return response.data;
  },
};
