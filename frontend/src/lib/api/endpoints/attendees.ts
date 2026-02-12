import apiClient from '../client';
import {
  Attendee,
  AttendeeRegistrationData,
  AttendeeLoginData,
  AttendeeAuthResponse,
  AttendeeProfileUpdate,
  WalletData,
  AddFundsData,
  TicketsData,
} from '@/types/attendee';

export const attendeesAPI = {
  // Authentication
  register: async (data: AttendeeRegistrationData): Promise<AttendeeAuthResponse> => {
    const response = await apiClient.post('/attendees/register/', data);
    return response.data;
  },

  login: async (data: AttendeeLoginData): Promise<AttendeeAuthResponse> => {
    const response = await apiClient.post('/attendees/login/', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/attendees/logout/');
  },

  // Profile Management
  getProfile: async (): Promise<Attendee> => {
    const response = await apiClient.get('/attendees/profile/');
    return response.data;
  },

  updateProfile: async (data: AttendeeProfileUpdate): Promise<Attendee> => {
    const response = await apiClient.patch('/attendees/profile/', data);
    return response.data;
  },

  // Wallet Management
  getWallet: async (): Promise<WalletData> => {
    const response = await apiClient.get('/attendees/wallet/');
    return response.data;
  },

  addFunds: async (data: AddFundsData): Promise<any> => {
    const response = await apiClient.post('/attendees/wallet/', data);
    return response.data;
  },

  // Tickets
  getTickets: async (): Promise<TicketsData> => {
    const response = await apiClient.get('/attendees/tickets/');
    return response.data;
  },
};
