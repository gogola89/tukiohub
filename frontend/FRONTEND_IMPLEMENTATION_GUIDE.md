# TukioHub Frontend Implementation Guide
## Next.js 14 + TypeScript + Tailwind CSS

**Last Updated**: December 2024
**Backend API**: Complete and Ready
**Target Framework**: Next.js 14 with App Router
**Status**: Ready for Implementation

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Setup](#project-setup)
4. [Implementation Sprints](#implementation-sprints)
5. [API Integration Guide](#api-integration-guide)
6. [Component Architecture](#component-architecture)
7. [State Management](#state-management)
8. [Routing Structure](#routing-structure)

---

## Project Overview

TukioHub is an event management platform designed for the Kenyan market. The frontend provides:

- **Public User Experience**: Browse events, book tickets, make payments via M-Pesa
- **Organizer Dashboard**: Manage events, tickets, promo codes, view analytics
- **Admin Dashboard**: Manage organizer approvals, platform analytics
- **Guest Checkout**: No attendee registration required
- **Mobile-First Design**: Responsive UI optimized for mobile devices

### Key Features

✅ Event discovery and search
✅ Multi-tier ticket booking with add-ons
✅ M-Pesa STK Push payment integration
✅ QR code ticket generation and verification
✅ Real-time payment status tracking
✅ Organizer analytics and reporting
✅ Admin approval workflow

---

## Technology Stack

### Core Framework
- **Next.js 14**: App Router, Server Components, Server Actions
- **TypeScript**: Type-safe development
- **React 18**: Latest React features including hooks

### Styling & UI
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality React components
- **Radix UI**: Headless UI primitives
- **Lucide Icons**: Icon library

### Forms & Validation
- **React Hook Form**: Performant form handling
- **Zod**: TypeScript-first schema validation

### Data Fetching & State
- **TanStack Query (React Query)**: Server state management
- **Zustand**: Client state management (auth, cart)
- **axios**: HTTP client for API calls

### Additional Libraries
- **date-fns**: Date manipulation
- **qrcode.react**: QR code generation
- **react-hot-toast**: Toast notifications
- **next-themes**: Dark mode support

---

## Project Setup

### Initial Setup Commands

```bash
# Create Next.js app
npx create-next-app@latest frontend --typescript --tailwind --app --src-dir

# Navigate to project
cd frontend

# Install dependencies
npm install axios @tanstack/react-query zustand
npm install react-hook-form zod @hookform/resolvers
npm install date-fns qrcode.react react-hot-toast
npm install lucide-react next-themes

# Install shadcn/ui
npx shadcn-ui@latest init

# Install shadcn/ui components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add form
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add select
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add skeleton
```

### Environment Variables

Create `.env.local`:

```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# M-Pesa (if needed for frontend display)
NEXT_PUBLIC_MPESA_SHORTCODE=174379

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=
```

### Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth routes (login, register)
│   │   ├── (public)/          # Public routes (browse events)
│   │   ├── (organizer)/       # Organizer dashboard
│   │   ├── (admin)/           # Admin dashboard
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   │
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── layout/           # Layout components (Header, Footer)
│   │   ├── events/           # Event-related components
│   │   ├── booking/          # Booking flow components
│   │   ├── dashboard/        # Dashboard components
│   │   └── common/           # Shared components
│   │
│   ├── lib/                   # Utility functions
│   │   ├── api/              # API client and endpoints
│   │   ├── hooks/            # Custom React hooks
│   │   ├── store/            # Zustand stores
│   │   ├── utils/            # Helper functions
│   │   └── validations/      # Zod schemas
│   │
│   ├── types/                 # TypeScript type definitions
│   │   ├── api.ts            # API response types
│   │   ├── event.ts          # Event types
│   │   ├── booking.ts        # Booking types
│   │   └── user.ts           # User types
│   │
│   └── styles/                # Global styles
│       └── globals.css       # Global CSS with Tailwind
│
├── public/                    # Static assets
│   ├── images/
│   └── icons/
│
└── package.json
```

---

## Implementation Sprints

### Sprint 1: Project Foundation & Setup (2-3 days)

**Goal**: Set up the Next.js project with all necessary dependencies and configurations

#### Tasks:

1. **Initialize Next.js Project**
   - Create Next.js 14 app with TypeScript and Tailwind CSS
   - Configure `next.config.js` for image optimization
   - Set up ESLint and Prettier

2. **Install Dependencies**
   - Install all required packages (see Project Setup section)
   - Configure shadcn/ui and add initial components

3. **Create Project Structure**
   - Set up folder structure (app, components, lib, types)
   - Create base layout components (RootLayout, Header, Footer)

4. **Configure API Client**
   - Create axios instance with interceptors
   - Set up TanStack Query provider
   - Create base API service functions

5. **Set Up Authentication Store**
   - Create Zustand store for auth state
   - Implement token storage (localStorage)
   - Create auth context/provider

6. **Create TypeScript Types**
   - Define types for User, Event, Ticket, Booking
   - Create API response types
   - Set up type utilities

**Deliverables**:
- ✅ Running Next.js app on `localhost:3000`
- ✅ API client configured and tested
- ✅ Basic layout components (Header, Footer)
- ✅ TypeScript types for all entities
- ✅ Authentication store ready

**Files to Create**:
```
src/lib/api/client.ts
src/lib/api/endpoints/auth.ts
src/lib/store/authStore.ts
src/types/user.ts
src/types/event.ts
src/types/booking.ts
src/types/api.ts
src/app/layout.tsx
src/components/layout/Header.tsx
src/components/layout/Footer.tsx
```

---

### Sprint 2: Authentication & User Management (3-4 days)

**Goal**: Implement complete authentication flow for organizers and admins

#### Tasks:

1. **Create Auth Pages**
   - Login page (`/login`)
   - Register page (`/register`)
   - Forgot password page
   - Email verification page

2. **Build Auth Components**
   - LoginForm component with React Hook Form
   - RegisterForm component with validation
   - Password reset form
   - Email verification component

3. **Implement Auth Logic**
   - Login API integration
   - Registration API integration
   - Token refresh logic
   - Logout functionality

4. **Create Protected Routes**
   - Auth middleware for protected pages
   - Redirect logic for unauthorized users
   - Role-based access control (Organizer/Admin)

5. **User Profile Management**
   - View profile page
   - Edit profile form
   - Upload profile image
   - Update password

**API Endpoints Used**:
- POST `/api/auth/register/`
- POST `/api/auth/login/`
- POST `/api/auth/refresh/`
- GET `/api/auth/me/`
- PUT `/api/auth/me/`
- POST `/api/auth/forgot-password/`
- POST `/api/auth/reset-password/`
- POST `/api/auth/verify-email/`

**Deliverables**:
- ✅ Complete login/register flow
- ✅ JWT token management with auto-refresh
- ✅ Protected route middleware
- ✅ User profile management

**Files to Create**:
```
src/app/(auth)/login/page.tsx
src/app/(auth)/register/page.tsx
src/components/auth/LoginForm.tsx
src/components/auth/RegisterForm.tsx
src/lib/api/endpoints/auth.ts
src/lib/hooks/useAuth.ts
src/lib/validations/auth.ts
src/middleware.ts
```

---

### Sprint 3: Public Event Discovery (3-4 days)

**Goal**: Build the public-facing event browsing experience

#### Tasks:

1. **Home Page**
   - Hero section with search
   - Featured events carousel
   - Category navigation
   - Upcoming events section

2. **Event Listing Pages**
   - Browse all events (`/events`)
   - Events by category (`/events/category/[category]`)
   - Search results page (`/events/search`)
   - Nearby events page

3. **Event Detail Page**
   - Event information display
   - Ticket types and pricing
   - Event location with map (Google Maps or Mapbox)
   - Share event functionality
   - "Book Now" CTA

4. **Event Components**
   - EventCard component
   - EventGrid/EventList toggle
   - EventFilter component
   - EventSearch component
   - CategoryFilter component

5. **Search & Filter**
   - Text search implementation
   - Category filter
   - Date range filter
   - Location/city filter
   - Price range filter

**API Endpoints Used**:
- GET `/api/public/events/`
- GET `/api/public/events/{slug}/`
- GET `/api/public/events/featured/`
- GET `/api/public/events/categories/`
- GET `/api/public/events/category/{category}/`
- GET `/api/public/events/search/`
- GET `/api/public/events/nearby/`

**Deliverables**:
- ✅ Responsive home page
- ✅ Event browsing with filters
- ✅ Search functionality
- ✅ Event detail page with booking CTA

**Files to Create**:
```
src/app/(public)/page.tsx
src/app/(public)/events/page.tsx
src/app/(public)/events/[slug]/page.tsx
src/app/(public)/events/category/[category]/page.tsx
src/components/events/EventCard.tsx
src/components/events/EventGrid.tsx
src/components/events/EventDetail.tsx
src/components/events/EventSearch.tsx
src/components/events/EventFilter.tsx
src/lib/api/endpoints/events.ts
src/lib/hooks/useEvents.ts
```

---

### Sprint 4: Booking Flow & Cart (4-5 days)

**Goal**: Implement the complete ticket booking flow with cart management

#### Tasks:

1. **Cart State Management**
   - Create booking cart store (Zustand)
   - Add/remove ticket types
   - Add/remove add-ons
   - Apply promo code
   - Calculate totals with discounts

2. **Booking Flow Pages**
   - Ticket selection page
   - Attendee information form
   - Order summary page
   - Payment page

3. **Booking Components**
   - TicketSelector component (quantity input)
   - AddonSelector component
   - PromoCodeInput component
   - AttendeeForm component
   - OrderSummary component

4. **Booking API Integration**
   - Create booking API call
   - Validate attendee information
   - Handle booking timeout (5 minutes)
   - Display booking reference

5. **Cart Persistence**
   - Save cart to localStorage
   - Restore cart on page reload
   - Clear cart on booking completion

**API Endpoints Used**:
- POST `/api/bookings/create/`
- GET `/api/bookings/{booking_reference}/`
- POST `/api/bookings/{booking_reference}/cancel/`

**Deliverables**:
- ✅ Functional shopping cart
- ✅ Multi-step booking flow
- ✅ Promo code validation
- ✅ Booking creation and confirmation

**Files to Create**:
```
src/app/(public)/events/[slug]/book/page.tsx
src/components/booking/TicketSelector.tsx
src/components/booking/AddonSelector.tsx
src/components/booking/PromoCodeInput.tsx
src/components/booking/AttendeeForm.tsx
src/components/booking/OrderSummary.tsx
src/components/booking/BookingTimer.tsx
src/lib/store/cartStore.ts
src/lib/api/endpoints/bookings.ts
src/lib/hooks/useBooking.ts
src/lib/validations/booking.ts
```

---

### Sprint 5: M-Pesa Payment Integration (3-4 days)

**Goal**: Implement M-Pesa STK Push payment flow with real-time status tracking

#### Tasks:

1. **Payment Initiation**
   - Payment page with M-Pesa option
   - Phone number input with Kenyan validation
   - Initiate STK Push API call
   - Display "Check your phone" message

2. **Payment Status Tracking**
   - Poll payment status endpoint
   - Real-time status updates (PENDING → COMPLETED/FAILED)
   - Loading states during payment
   - Success/failure notifications

3. **Payment Components**
   - MpesaPayment component
   - PhoneNumberInput component
   - PaymentStatusTracker component
   - PaymentSuccess component
   - PaymentFailed component

4. **Post-Payment Flow**
   - Redirect to ticket confirmation page
   - Display ticket details
   - Download ticket button
   - Email confirmation sent notification

5. **Error Handling**
   - Handle timeout (user doesn't enter PIN)
   - Handle cancellation
   - Handle insufficient funds
   - Handle network errors

**API Endpoints Used**:
- POST `/api/payments/mpesa/initiate/`
- GET `/api/payments/status/{transaction_reference}/`

**Deliverables**:
- ✅ M-Pesa payment initiation
- ✅ Real-time payment tracking
- ✅ Payment success/failure handling
- ✅ Ticket confirmation page

**Files to Create**:
```
src/app/(public)/payment/page.tsx
src/app/(public)/booking/[reference]/confirmation/page.tsx
src/components/payment/MpesaPayment.tsx
src/components/payment/PhoneNumberInput.tsx
src/components/payment/PaymentStatusTracker.tsx
src/components/payment/PaymentSuccess.tsx
src/components/payment/PaymentFailed.tsx
src/lib/api/endpoints/payments.ts
src/lib/hooks/usePayment.ts
src/lib/validations/payment.ts
```

---

### Sprint 6: Ticket Management (2-3 days)

**Goal**: Allow users to view, download, and manage their tickets

#### Tasks:

1. **Ticket Display**
   - View booking details page
   - Display all tickets in booking
   - Show ticket QR code
   - Display booking reference

2. **Ticket Actions**
   - Download ticket as PDF
   - Transfer ticket to another person
   - View ticket status (ACTIVE, USED, TRANSFERRED)
   - Cancel booking (if allowed)

3. **Ticket Components**
   - TicketCard component
   - TicketQRCode component (using qrcode.react)
   - TicketTransferForm component
   - BookingDetails component

4. **Ticket Verification (Public)**
   - Ticket verification page (for organizers/staff)
   - Scan QR code or enter ticket code
   - Display ticket validity
   - Check-in functionality (for authenticated users)

**API Endpoints Used**:
- GET `/api/bookings/{booking_reference}/`
- POST `/api/bookings/tickets/verify/`
- PUT `/api/bookings/tickets/{ticket_code}/checkin/`
- POST `/api/bookings/tickets/{ticket_code}/transfer/`
- GET `/api/bookings/tickets/{ticket_code}/download/`

**Deliverables**:
- ✅ Ticket viewing page
- ✅ QR code display
- ✅ Ticket download
- ✅ Ticket transfer
- ✅ Ticket verification

**Files to Create**:
```
src/app/(public)/booking/[reference]/page.tsx
src/app/(public)/tickets/verify/page.tsx
src/components/tickets/TicketCard.tsx
src/components/tickets/TicketQRCode.tsx
src/components/tickets/TicketTransferForm.tsx
src/components/tickets/TicketVerification.tsx
src/lib/api/endpoints/tickets.ts
```

---

### Sprint 7: Organizer Dashboard - Event Management (4-5 days)

**Goal**: Build organizer dashboard for creating and managing events

#### Tasks:

1. **Dashboard Layout**
   - Organizer dashboard layout with sidebar
   - Navigation menu (Events, Analytics, Profile)
   - Quick stats overview
   - Responsive mobile navigation

2. **Event Management**
   - List all organizer events
   - Create new event form (multi-step)
   - Edit event details
   - Delete/cancel event
   - Publish/unpublish event

3. **Event Creation Form**
   - Step 1: Basic Info (title, description, category)
   - Step 2: Date & Location (venue, address, map)
   - Step 3: Capacity & Settings
   - Step 4: Images upload
   - Form validation with Zod

4. **Event Components**
   - CreateEventForm (multi-step)
   - EventList (organizer view)
   - EventEditForm
   - EventStatusBadge
   - EventActions dropdown

5. **Ticket Type Management**
   - Create ticket types for event
   - Edit ticket pricing and quantity
   - Set sales date ranges
   - Delete ticket types

**API Endpoints Used**:
- GET `/api/events/`
- POST `/api/events/`
- GET `/api/events/{id}/`
- PUT `/api/events/{id}/`
- DELETE `/api/events/{id}/`
- POST `/api/events/{id}/publish/`
- POST `/api/events/{id}/unpublish/`
- POST `/api/events/{id}/upload_images/`
- POST `/api/events/{id}/tickets/`
- PUT `/api/events/{id}/tickets/{ticket_id}/`
- DELETE `/api/events/{id}/tickets/{ticket_id}/`

**Deliverables**:
- ✅ Organizer dashboard layout
- ✅ Create/edit event functionality
- ✅ Event status management
- ✅ Ticket type management

**Files to Create**:
```
src/app/(organizer)/dashboard/layout.tsx
src/app/(organizer)/dashboard/page.tsx
src/app/(organizer)/dashboard/events/page.tsx
src/app/(organizer)/dashboard/events/create/page.tsx
src/app/(organizer)/dashboard/events/[id]/edit/page.tsx
src/components/dashboard/Sidebar.tsx
src/components/dashboard/DashboardStats.tsx
src/components/dashboard/events/CreateEventForm.tsx
src/components/dashboard/events/EventListTable.tsx
src/components/dashboard/tickets/TicketTypeForm.tsx
src/lib/api/endpoints/organizerEvents.ts
src/lib/validations/event.ts
```

---

### Sprint 8: Organizer Dashboard - Promo Codes & Add-ons (2-3 days)

**Goal**: Allow organizers to manage promo codes and event add-ons

#### Tasks:

1. **Promo Code Management**
   - List all promo codes for event
   - Create promo code form
   - Edit promo code
   - Deactivate/delete promo code
   - View promo code usage stats

2. **Promo Code Components**
   - PromoCodeForm component
   - PromoCodeList component
   - PromoCodeStats component

3. **Event Add-ons Management**
   - List all add-ons for event
   - Create add-on form
   - Edit add-on details
   - Delete add-on
   - Track add-on sales

4. **Add-on Components**
   - AddOnForm component
   - AddOnList component
   - AddOnStats component

**API Endpoints Used**:
- GET `/api/events/{id}/promo-codes/`
- POST `/api/events/{id}/promo-codes/`
- PUT `/api/events/{id}/promo-codes/{promo_id}/`
- POST `/api/events/{id}/promo-codes/{promo_id}/deactivate/`
- DELETE `/api/events/{id}/promo-codes/{promo_id}/`
- GET `/api/events/{id}/addons/`
- POST `/api/events/{id}/addons/`
- PUT `/api/events/{id}/addons/{addon_id}/`
- DELETE `/api/events/{id}/addons/{addon_id}/`

**Deliverables**:
- ✅ Promo code CRUD operations
- ✅ Add-on management
- ✅ Usage statistics display

**Files to Create**:
```
src/app/(organizer)/dashboard/events/[id]/promo-codes/page.tsx
src/app/(organizer)/dashboard/events/[id]/addons/page.tsx
src/components/dashboard/promos/PromoCodeForm.tsx
src/components/dashboard/promos/PromoCodeList.tsx
src/components/dashboard/addons/AddOnForm.tsx
src/components/dashboard/addons/AddOnList.tsx
```

---

### Sprint 9: Analytics & Reporting (3-4 days)

**Goal**: Build comprehensive analytics dashboard for organizers

#### Tasks:

1. **Dashboard Analytics**
   - Overview dashboard with key metrics
   - Revenue charts (daily, weekly, monthly)
   - Ticket sales graphs
   - Quick stats cards

2. **Event Analytics**
   - Event-specific analytics page
   - Sales timeline chart
   - Ticket type breakdown
   - Attendee demographics
   - Promo code performance

3. **Analytics Components**
   - RevenueChart component (using Chart.js or Recharts)
   - SalesTimelineChart component
   - TicketBreakdownPie component
   - MetricsCard component
   - AnalyticsSummary component

4. **Data Exports**
   - Export attendees to CSV
   - Export sales data to CSV
   - Download buttons in analytics pages

5. **Reporting**
   - Booking reports
   - Transaction reports
   - Attendee reports

**API Endpoints Used**:
- GET `/api/analytics/dashboard/`
- GET `/api/analytics/quick-stats/`
- GET `/api/analytics/events/{id}/overview/`
- GET `/api/analytics/events/{id}/sales-timeline/`
- GET `/api/analytics/events/{id}/demographics/`
- GET `/api/analytics/events/{id}/export/attendees/`
- GET `/api/analytics/events/{id}/export/sales/`

**Libraries to Install**:
```bash
npm install recharts
# or
npm install chart.js react-chartjs-2
```

**Deliverables**:
- ✅ Analytics dashboard
- ✅ Revenue and sales charts
- ✅ Event-specific analytics
- ✅ CSV export functionality

**Files to Create**:
```
src/app/(organizer)/dashboard/analytics/page.tsx
src/app/(organizer)/dashboard/events/[id]/analytics/page.tsx
src/components/dashboard/analytics/RevenueChart.tsx
src/components/dashboard/analytics/SalesTimeline.tsx
src/components/dashboard/analytics/TicketBreakdown.tsx
src/components/dashboard/analytics/MetricsCard.tsx
src/lib/api/endpoints/analytics.ts
```

---

### Sprint 10: Admin Dashboard (3-4 days)

**Goal**: Build admin panel for managing organizers and viewing platform analytics

#### Tasks:

1. **Admin Layout**
   - Admin dashboard layout
   - Admin navigation
   - Role-based access control

2. **Organizer Management**
   - List all organizers (with filters)
   - View organizer details
   - Approve/reject organizer accounts
   - View organizer documents
   - Suspension/activation

3. **Platform Analytics**
   - Platform-wide statistics
   - Total events, bookings, revenue
   - Growth charts
   - User activity logs

4. **Admin Components**
   - OrganizerList component
   - OrganizerDetail component
   - ApprovalActions component
   - PlatformStats component

**API Endpoints Used**:
- GET `/api/admin/organizers/`
- GET `/api/admin/organizers/{id}/`
- POST `/api/admin/organizers/{id}/approve-reject/`
- GET `/api/admin/dashboard/`
- GET `/api/admin/analytics/`

**Deliverables**:
- ✅ Admin dashboard layout
- ✅ Organizer approval system
- ✅ Platform analytics

**Files to Create**:
```
src/app/(admin)/admin/layout.tsx
src/app/(admin)/admin/page.tsx
src/app/(admin)/admin/organizers/page.tsx
src/app/(admin)/admin/organizers/[id]/page.tsx
src/app/(admin)/admin/analytics/page.tsx
src/components/admin/OrganizerList.tsx
src/components/admin/OrganizerDetail.tsx
src/components/admin/ApprovalActions.tsx
src/components/admin/PlatformStats.tsx
```

---

### Sprint 11: Polish & Optimization (3-4 days)

**Goal**: Optimize performance, add finishing touches, and prepare for production

#### Tasks:

1. **Performance Optimization**
   - Implement image optimization (next/image)
   - Add loading skeletons
   - Implement pagination for large lists
   - Add infinite scroll for event listings
   - Optimize bundle size

2. **Error Handling**
   - Global error boundary
   - 404 page
   - 500 error page
   - Network error handling
   - Form error states

3. **Loading States**
   - Skeleton loaders for all pages
   - Loading spinners
   - Suspense boundaries
   - Optimistic UI updates

4. **Accessibility**
   - Add ARIA labels
   - Keyboard navigation
   - Screen reader support
   - Focus management

5. **SEO & Meta Tags**
   - Add metadata to all pages
   - Open Graph tags
   - Twitter cards
   - Sitemap generation
   - robots.txt

6. **Mobile Optimization**
   - Test on mobile devices
   - Improve mobile navigation
   - Touch-friendly interactions
   - Optimize for slow networks

7. **Testing**
   - Write unit tests for utilities
   - Integration tests for API calls
   - E2E tests for critical flows
   - Component testing

**Deliverables**:
- ✅ Optimized performance
- ✅ Complete error handling
- ✅ Loading states everywhere
- ✅ SEO optimization
- ✅ Mobile-optimized UI
- ✅ Test coverage

**Files to Create**:
```
src/app/not-found.tsx
src/app/error.tsx
src/components/common/ErrorBoundary.tsx
src/components/common/LoadingSkeleton.tsx
src/lib/seo/metadata.ts
```

---

## API Integration Guide

### Setting Up API Client

Create `src/lib/api/client.ts`:

```typescript
import axios, { AxiosError, AxiosResponse } from 'axios';
import { authStore } from '@/lib/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = authStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // If 401 and not already retrying, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = authStore.getState().refreshToken;
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          authStore.getState().setTokens(access, refreshToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        authStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

### API Endpoint Organization

Create separate files for each resource:

**`src/lib/api/endpoints/auth.ts`**:

```typescript
import apiClient from '../client';
import { User, LoginCredentials, RegisterData } from '@/types/user';

export const authAPI = {
  login: async (credentials: LoginCredentials) => {
    const response = await apiClient.post('/auth/login/', credentials);
    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await apiClient.post('/auth/register/', data);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me/');
    return response.data;
  },

  updateProfile: async (data: Partial<User>) => {
    const response = await apiClient.put('/auth/me/', data);
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await apiClient.post('/auth/refresh/', {
      refresh: refreshToken,
    });
    return response.data;
  },
};
```

**`src/lib/api/endpoints/events.ts`**:

```typescript
import apiClient from '../client';
import { Event, EventListParams } from '@/types/event';

export const eventsAPI = {
  // Public endpoints
  getPublicEvents: async (params?: EventListParams) => {
    const response = await apiClient.get('/public/events/', { params });
    return response.data;
  },

  getEventBySlug: async (slug: string): Promise<Event> => {
    const response = await apiClient.get(`/public/events/${slug}/`);
    return response.data;
  },

  getFeaturedEvents: async () => {
    const response = await apiClient.get('/public/events/featured/');
    return response.data;
  },

  searchEvents: async (query: string, filters?: any) => {
    const response = await apiClient.get('/public/events/search/', {
      params: { q: query, ...filters },
    });
    return response.data;
  },

  // Organizer endpoints
  getMyEvents: async () => {
    const response = await apiClient.get('/events/');
    return response.data;
  },

  createEvent: async (data: Partial<Event>) => {
    const response = await apiClient.post('/events/', data);
    return response.data;
  },

  updateEvent: async (id: string, data: Partial<Event>) => {
    const response = await apiClient.put(`/events/${id}/`, data);
    return response.data;
  },

  deleteEvent: async (id: string) => {
    const response = await apiClient.delete(`/events/${id}/`);
    return response.data;
  },

  publishEvent: async (id: string) => {
    const response = await apiClient.post(`/events/${id}/publish/`);
    return response.data;
  },
};
```

### Using TanStack Query (React Query)

**Setup Provider** in `src/app/layout.tsx`:

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**Custom Hook Example** - `src/lib/hooks/useEvents.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsAPI } from '@/lib/api/endpoints/events';
import { Event } from '@/types/event';

export function usePublicEvents(params?: any) {
  return useQuery({
    queryKey: ['public-events', params],
    queryFn: () => eventsAPI.getPublicEvents(params),
  });
}

export function useEventBySlug(slug: string) {
  return useQuery({
    queryKey: ['event', slug],
    queryFn: () => eventsAPI.getEventBySlug(slug),
    enabled: !!slug,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Event>) => eventsAPI.createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-events'] });
    },
  });
}

export function useUpdateEvent(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Event>) => eventsAPI.updateEvent(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-events'] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });
}
```

**Usage in Component**:

```typescript
'use client';

import { usePublicEvents } from '@/lib/hooks/useEvents';
import EventCard from '@/components/events/EventCard';

export default function EventsPage() {
  const { data: events, isLoading, error } = usePublicEvents();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {events?.results.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
```

---

## Component Architecture

### Layout Components

**Header.tsx**:
```typescript
export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Logo />
        <Navigation />
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/dashboard">Dashboard</Link>
              <UserMenu user={user} onLogout={logout} />
            </>
          ) : (
            <>
              <Link href="/login">Login</Link>
              <Link href="/register">Register</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
```

### Reusable Components

**EventCard.tsx**:
```typescript
import { Event } from '@/types/event';
import { format } from 'date-fns';
import { MapPin, Calendar } from 'lucide-react';
import Link from 'next/link';

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <Link href={`/events/${event.slug}`}>
      <div className="border rounded-lg overflow-hidden hover:shadow-lg transition">
        <img
          src={event.image || '/placeholder.jpg'}
          alt={event.title}
          className="w-full h-48 object-cover"
        />
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <Calendar className="w-4 h-4 mr-2" />
            {format(new Date(event.start_datetime), 'PPP')}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            {event.venue_city}
          </div>
          <div className="mt-4 flex justify-between items-center">
            <span className="text-sm text-gray-500">{event.category}</span>
            <span className="font-bold text-primary">
              From KES {event.min_price}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

---

## State Management

### Auth Store (Zustand)

**`src/lib/store/authStore.ts`**:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/user';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

### Cart Store

**`src/lib/store/cartStore.ts`**:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  ticket_type_id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartAddon {
  addon_id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  eventId: string | null;
  items: CartItem[];
  addons: CartAddon[];
  promoCode: string | null;
  discount: number;
  setEvent: (eventId: string) => void;
  addItem: (item: CartItem) => void;
  removeItem: (ticketTypeId: string) => void;
  updateItemQuantity: (ticketTypeId: string, quantity: number) => void;
  addAddon: (addon: CartAddon) => void;
  removeAddon: (addonId: string) => void;
  applyPromoCode: (code: string, discount: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      eventId: null,
      items: [],
      addons: [],
      promoCode: null,
      discount: 0,
      setEvent: (eventId) => set({ eventId }),
      addItem: (item) =>
        set((state) => ({
          items: [...state.items, item],
        })),
      removeItem: (ticketTypeId) =>
        set((state) => ({
          items: state.items.filter((i) => i.ticket_type_id !== ticketTypeId),
        })),
      updateItemQuantity: (ticketTypeId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.ticket_type_id === ticketTypeId ? { ...i, quantity } : i
          ),
        })),
      addAddon: (addon) =>
        set((state) => ({
          addons: [...state.addons, addon],
        })),
      removeAddon: (addonId) =>
        set((state) => ({
          addons: state.addons.filter((a) => a.addon_id !== addonId),
        })),
      applyPromoCode: (code, discount) =>
        set({ promoCode: code, discount }),
      clearCart: () =>
        set({
          eventId: null,
          items: [],
          addons: [],
          promoCode: null,
          discount: 0,
        }),
      getTotal: () => {
        const state = get();
        const itemsTotal = state.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        const addonsTotal = state.addons.reduce(
          (sum, addon) => sum + addon.price * addon.quantity,
          0
        );
        const total = itemsTotal + addonsTotal;
        return total - state.discount;
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
```

---

## Routing Structure

```
/                           # Home page (featured events, categories)
/events                     # Browse all events
/events/[slug]              # Event detail page
/events/[slug]/book         # Booking page
/events/category/[category] # Events by category
/events/search              # Search results

/login                      # Login page
/register                   # Register page
/forgot-password            # Forgot password
/reset-password             # Reset password

/booking/[reference]        # Booking confirmation
/booking/[reference]/confirmation  # Payment success
/payment                    # Payment page

/tickets/verify             # Public ticket verification

/dashboard                  # Organizer dashboard (redirects based on role)
/dashboard/events           # List my events
/dashboard/events/create    # Create new event
/dashboard/events/[id]/edit # Edit event
/dashboard/events/[id]/tickets  # Manage tickets
/dashboard/events/[id]/promo-codes  # Manage promo codes
/dashboard/events/[id]/addons       # Manage add-ons
/dashboard/events/[id]/analytics    # Event analytics
/dashboard/analytics        # Overall analytics
/dashboard/profile          # Organizer profile

/admin                      # Admin dashboard
/admin/organizers           # Manage organizers
/admin/organizers/[id]      # Organizer details
/admin/analytics            # Platform analytics
```

---

## Best Practices

### 1. TypeScript Usage
- Define all types in `src/types/`
- Use interfaces for object shapes
- Use type aliases for unions and primitives
- Enable strict mode in `tsconfig.json`

### 2. Component Organization
- One component per file
- Group related components in folders
- Use index.ts for cleaner imports
- Keep components small and focused

### 3. API Calls
- Always use TanStack Query for data fetching
- Handle loading and error states
- Use optimistic updates where appropriate
- Implement proper error boundaries

### 4. Styling
- Use Tailwind utility classes
- Create reusable component variants with CVA (Class Variance Authority)
- Use shadcn/ui components as base
- Maintain consistent spacing and colors

### 5. Performance
- Use Next.js Image component for images
- Implement code splitting with dynamic imports
- Use React.memo for expensive components
- Optimize bundle size with tree shaking

### 6. Security
- Never store sensitive data in localStorage
- Validate all user inputs
- Sanitize data before rendering
- Use HTTPS in production

---

## Testing Strategy

### Unit Tests
- Test utility functions
- Test validation schemas
- Test custom hooks

### Integration Tests
- Test API integration
- Test form submissions
- Test authentication flow

### E2E Tests
- Test complete booking flow
- Test payment process
- Test event creation

### Tools
- Jest for unit tests
- React Testing Library for component tests
- Playwright or Cypress for E2E tests

---

## Deployment Checklist

### Before Deployment

- [ ] Update environment variables for production
- [ ] Set up production API URL
- [ ] Configure analytics (Google Analytics, etc.)
- [ ] Set up error tracking (Sentry)
- [ ] Optimize images and assets
- [ ] Run lighthouse audit
- [ ] Test on multiple devices
- [ ] Enable production optimizations in Next.js
- [ ] Set up CDN for static assets
- [ ] Configure caching strategies

### Deployment Platforms

**Recommended: Vercel** (optimized for Next.js)
```bash
npm install -g vercel
vercel
```

**Alternative: Netlify, AWS Amplify, or Docker**

---

## Conclusion

This guide provides a complete roadmap for building the TukioHub frontend. Follow the sprints in order, test thoroughly at each stage, and maintain clean code practices throughout.

**Total Estimated Time**: 6-8 weeks for a single developer

**Questions or Issues?**
- Refer to Next.js documentation: https://nextjs.org/docs
- TanStack Query docs: https://tanstack.com/query/latest
- shadcn/ui: https://ui.shadcn.com

**Happy Coding! 🚀**
