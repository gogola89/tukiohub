import { useQuery } from '@tanstack/react-query';
import { eventsAPI } from '@/lib/api/endpoints/events';
import { EventListParams } from '@/types/event';

export function usePublicEvents(params?: EventListParams) {
  return useQuery({
    queryKey: ['public-events', params],
    queryFn: () => eventsAPI.getPublicEvents(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useEventBySlug(slug: string) {
  return useQuery({
    queryKey: ['event', slug],
    queryFn: () => eventsAPI.getEventBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useFeaturedEvents() {
  return useQuery({
    queryKey: ['featured-events'],
    queryFn: eventsAPI.getFeaturedEvents,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpcomingEvents() {
  return useQuery({
    queryKey: ['upcoming-events'],
    queryFn: eventsAPI.getUpcomingEvents,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['event-categories'],
    queryFn: eventsAPI.getCategories,
    staleTime: 30 * 60 * 1000, // 30 minutes - categories don't change often
  });
}

export function useSearchEvents(query: string, filters?: any) {
  return useQuery({
    queryKey: ['search-events', query, filters],
    queryFn: () => eventsAPI.searchEvents(query, filters),
    enabled: !!query && query.length > 0,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useNearbyEvents(latitude?: number, longitude?: number, radius = 50) {
  return useQuery({
    queryKey: ['nearby-events', latitude, longitude, radius],
    queryFn: () => eventsAPI.getNearbyEvents(latitude!, longitude!, radius),
    enabled: !!latitude && !!longitude,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
