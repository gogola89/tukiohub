import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingsAPI } from '@/lib/api/endpoints/bookings';
import { CreateBookingData } from '@/types/booking';

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBookingData) => bookingsAPI.createBooking(data),
    onSuccess: (data) => {
      // Invalidate and refetch booking queries
      queryClient.invalidateQueries({ queryKey: ['booking', data.booking_reference] });
    },
  });
}

export function useBooking(bookingReference: string) {
  return useQuery({
    queryKey: ['booking', bookingReference],
    queryFn: () => bookingsAPI.getBooking(bookingReference),
    enabled: !!bookingReference,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: (query) => {
      // Auto-refetch every 5 seconds if booking is still pending
      if (query.state.data?.payment_status === 'PENDING') {
        return 5 * 1000; // 5 seconds
      }
      return false; // Don't refetch if completed/failed
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingReference: string) => bookingsAPI.cancelBooking(bookingReference),
    onSuccess: (_, bookingReference) => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingReference] });
    },
  });
}

export function useValidatePromoCode() {
  return useMutation({
    mutationFn: ({ eventId, promoCode, attendeeEmail }: { eventId: string; promoCode: string; attendeeEmail?: string }) =>
      bookingsAPI.validatePromoCode(eventId, promoCode, attendeeEmail),
  });
}
