import apiClient from '../client';
import { Event, EventListParams } from '@/types/event';
import { PaginatedResponse } from '@/types/api';

// Transform API response to match our Event type
const transformEventResponse = (apiEvent: any): Event => {
  return {
    ...apiEvent,
    // Map featured_image_url to image
    image: apiEvent.featured_image_url || apiEvent.featured_image || apiEvent.image,
    // Map event_images to images (event_images takes precedence over images)
    images: apiEvent.event_images && apiEvent.event_images.length > 0
      ? apiEvent.event_images
      : (apiEvent.images || []),
    // Ensure organizer is an object (for list endpoints that return organizer_name)
    organizer: apiEvent.organizer || {
      id: '',
      company_name: apiEvent.organizer_name || 'Unknown Organizer',
      profile_image: undefined,
    },
    // Ensure capacity exists
    capacity: apiEvent.capacity || 0,
    tickets_sold: apiEvent.tickets_sold || 0,
    revenue: apiEvent.revenue || 0,
    // Transform ticket_types - convert price from string to number
    ticket_types: apiEvent.ticket_types?.map((ticket: any) => ({
      ...ticket,
      price: typeof ticket.price === 'string' ? parseFloat(ticket.price) : ticket.price,
      min_purchase: ticket.min_purchase ?? 1,
      max_purchase: ticket.max_purchase ?? 10,
    })),
  };
};

export const eventsAPI = {
  // Public endpoints
  getPublicEvents: async (params?: EventListParams): Promise<PaginatedResponse<Event>> => {
    const response = await apiClient.get('/public/events/', { params });
    return {
      ...response.data,
      results: response.data.results.map(transformEventResponse),
    };
  },

  getEventBySlug: async (slug: string): Promise<Event> => {
    const response = await apiClient.get(`/public/events/${slug}/`);
    return transformEventResponse(response.data);
  },

  getFeaturedEvents: async (): Promise<Event[]> => {
    const response = await apiClient.get('/public/events/featured/');
    return response.data.map(transformEventResponse);
  },

  getCategories: async (): Promise<string[]> => {
    const response = await apiClient.get('/public/events/categories/');
    return response.data;
  },

  searchEvents: async (query: string, filters?: any): Promise<PaginatedResponse<Event>> => {
    const response = await apiClient.get('/public/events/search/', {
      params: { q: query, ...filters },
    });
    return {
      ...response.data,
      results: response.data.results.map(transformEventResponse),
    };
  },

  getNearbyEvents: async (latitude: number, longitude: number, radius = 50): Promise<Event[]> => {
    const response = await apiClient.get('/public/events/nearby/', {
      params: { latitude, longitude, radius },
    });
    return response.data.map(transformEventResponse);
  },

  getUpcomingEvents: async (): Promise<Event[]> => {
    const response = await apiClient.get('/public/events/upcoming/');
    return response.data.map(transformEventResponse);
  },

  // Organizer endpoints
  getMyEvents: async (): Promise<Event[]> => {
    const response = await apiClient.get('/events/');
    // Handle both array response and paginated response
    if (Array.isArray(response.data)) {
      return response.data.map(transformEventResponse);
    } else if (response.data.results && Array.isArray(response.data.results)) {
      return response.data.results.map(transformEventResponse);
    }
    return [];
  },

  createEvent: async (data: Partial<Event>): Promise<Event> => {
    const response = await apiClient.post('/events/', data);
    return transformEventResponse(response.data);
  },

  getEventById: async (id: string): Promise<Event> => {
    const response = await apiClient.get(`/events/${id}/`);
    return transformEventResponse(response.data);
  },

  updateEvent: async (id: string, data: Partial<Event>): Promise<Event> => {
    const response = await apiClient.put(`/events/${id}/`, data);
    return transformEventResponse(response.data);
  },

  deleteEvent: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/events/${id}/`);
    return response.data;
  },

  publishEvent: async (id: string): Promise<Event> => {
    const response = await apiClient.post(`/events/${id}/publish/`);
    return transformEventResponse(response.data);
  },

  unpublishEvent: async (id: string): Promise<Event> => {
    const response = await apiClient.post(`/events/${id}/unpublish/`);
    return transformEventResponse(response.data);
  },

  cancelEvent: async (id: string, reason: string): Promise<Event> => {
    const response = await apiClient.post(`/events/${id}/cancel/`, {
      cancellation_reason: reason,
    });
    return transformEventResponse(response.data);
  },

  uploadFeaturedImage: async (id: string, image: File): Promise<Event> => {
    const formData = new FormData();
    formData.append('featured_image', image);
    // Don't set Content-Type - let browser set it with boundary
    const response = await apiClient.patch(`/events/${id}/`, formData);
    return transformEventResponse(response.data);
  },

  uploadEventImage: async (id: string, image: File, order: number = 0): Promise<any> => {
    const formData = new FormData();
    formData.append('image', image);
    formData.append('order', order.toString());
    // Don't set Content-Type - let browser set it with boundary
    const response = await apiClient.post(`/events/${id}/upload_images/`, formData);
    return response.data;
  },

  getEventImages: async (id: string): Promise<any[]> => {
    const response = await apiClient.get(`/events/${id}/event_images/`);
    return response.data;
  },

  updateImageOrder: async (id: string, imageId: string, order: number): Promise<any> => {
    const response = await apiClient.put(`/events/${id}/event_images/${imageId}/`, { order });
    return response.data;
  },

  deleteEventImage: async (id: string, imageId: string): Promise<void> => {
    await apiClient.delete(`/events/${id}/event_images/${imageId}/`);
  },

  // Ticket Type Management
  createTicketType: async (eventId: string, data: any) => {
    const response = await apiClient.post(`/events/${eventId}/tickets/`, data);
    return response.data;
  },

  updateTicketType: async (eventId: string, ticketId: string, data: any) => {
    const response = await apiClient.put(`/events/${eventId}/tickets/${ticketId}/`, data);
    return response.data;
  },

  deleteTicketType: async (eventId: string, ticketId: string) => {
    const response = await apiClient.delete(`/events/${eventId}/tickets/${ticketId}/`);
    return response.data;
  },

  // Promo Code Management
  getPromoCodes: async (eventId: string) => {
    const response = await apiClient.get(`/events/${eventId}/promo-codes/`);
    return response.data;
  },

  createPromoCode: async (eventId: string, data: any) => {
    const response = await apiClient.post(`/events/${eventId}/promo-codes/`, data);
    return response.data;
  },

  updatePromoCode: async (eventId: string, promoId: string, data: any) => {
    const response = await apiClient.put(`/events/${eventId}/promo-codes/${promoId}/`, data);
    return response.data;
  },

  deletePromoCode: async (eventId: string, promoId: string) => {
    const response = await apiClient.delete(`/events/${eventId}/promo-codes/${promoId}/`);
    return response.data;
  },

  deactivatePromoCode: async (eventId: string, promoId: string) => {
    const response = await apiClient.post(`/events/${eventId}/promo-codes/${promoId}/deactivate/`);
    return response.data;
  },

  // Add-ons Management
  getAddons: async (eventId: string) => {
    const response = await apiClient.get(`/events/${eventId}/addons/`);
    return response.data;
  },

  createAddon: async (eventId: string, data: any) => {
    const response = await apiClient.post(`/events/${eventId}/addons/`, data);
    return response.data;
  },

  updateAddon: async (eventId: string, addonId: string, data: any) => {
    const response = await apiClient.put(`/events/${eventId}/addons/${addonId}/`, data);
    return response.data;
  },

  deleteAddon: async (eventId: string, addonId: string) => {
    const response = await apiClient.delete(`/events/${eventId}/addons/${addonId}/`);
    return response.data;
  },
};
