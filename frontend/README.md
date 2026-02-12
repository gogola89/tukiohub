# TukioHub - Event Management Platform (Frontend)

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A modern, feature-rich event management platform for the Kenyan market, built with Next.js 14 and TypeScript. TukioHub enables event organizers to create and manage events, attendees to discover and book tickets, and admins to oversee the platform.

**Current Status**: ✅ Feature-Complete (Sprint 1-10 Completed) | 🟡 Sprint 11 In Progress (Polish & Optimization)

---

## Features

### For Attendees
- **Event Discovery**: Browse, search, and filter events by category, location, and date
- **Guest Checkout**: Book tickets without registration
- **Multiple Payment Options**: M-Pesa STK Push, Stripe card payments, or digital wallet
- **Digital Tickets**: QR code tickets with PDF download
- **Ticket Management**: View, transfer, and verify tickets
- **Digital Wallet**: Top up wallet for instant payments

### For Event Organizers
- **Event Management**: Create, edit, publish, and manage events
- **Ticket Types**: Create multiple ticket tiers with custom pricing
- **Promo Codes**: Percentage or fixed amount discounts with usage limits
- **Event Add-ons**: Optional extras for attendees to purchase
- **Analytics Dashboard**: Revenue, bookings, and attendee insights
- **CSV Exports**: Download attendee and sales data
- **Image Management**: Upload multiple event images with ordering

### For Administrators
- **Organizer Approval**: Review and approve/reject organizer applications
- **Platform Analytics**: View platform-wide statistics and metrics
- **Event Oversight**: Monitor all events across the platform
- **User Management**: Manage organizers and their verification status

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5.0 (strict mode) |
| **Styling** | Tailwind CSS 4 |
| **UI Components** | shadcn/ui + Radix UI |
| **State Management** | Zustand + TanStack Query (React Query) |
| **Forms** | React Hook Form + Zod validation |
| **HTTP Client** | Axios (with interceptors) |
| **Charts** | Recharts |
| **Payments** | Stripe Elements, M-Pesa Daraja API |
| **QR Codes** | qrcode.react |
| **Notifications** | Sonner (toast library) |
| **Date Handling** | date-fns |
| **Icons** | Lucide React |

---

## Project Structure

```
src/
├── app/                    # Next.js App Router (~30 pages)
│   ├── (auth)/            # Authentication pages
│   ├── (public)/          # Public-facing pages
│   ├── (organizer)/       # Organizer dashboard
│   ├── (admin)/           # Admin panel
│   └── (attendee)/        # Attendee profile
│
├── components/            # React Components (66 components)
│   ├── ui/               # shadcn/ui components (21)
│   ├── layout/           # Header, Footer, layouts
│   ├── auth/             # Authentication forms
│   ├── events/           # Event browsing components
│   ├── booking/          # Booking flow components
│   ├── payment/          # Payment processing
│   ├── tickets/          # Ticket management
│   ├── dashboard/        # Organizer dashboard
│   ├── admin/            # Admin components
│   └── wallet/           # Digital wallet
│
├── lib/                   # Utilities & Logic
│   ├── api/              # API client & 8 endpoint modules
│   ├── hooks/            # Custom React hooks (5)
│   ├── store/            # Zustand stores (3)
│   ├── validations/      # Zod schemas (5)
│   └── utils/            # Helper functions
│
└── types/                 # TypeScript Types (6 files)
```

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- Backend API running at `http://localhost:8000` (see `../eventms/backend/`)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd event-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   # Backend API URL
   NEXT_PUBLIC_API_URL=http://localhost:8000/api

   # Stripe Public Key (for card payments)
   NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...

   # Site URL
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Type check without emitting files |

---

## Implementation Status

### ✅ Completed Features (Sprints 1-10)

**Sprint 1: Project Foundation**
- Next.js 14 setup with TypeScript and Tailwind CSS
- API client with JWT authentication
- Zustand stores for auth and cart
- Complete TypeScript type definitions

**Sprint 2: Authentication**
- Multi-role login (organizer, admin, attendee)
- Registration with email verification
- Password reset flow
- JWT token auto-refresh
- Profile management

**Sprint 3: Public Event Discovery**
- Home page with featured events
- Event browsing with search and filters
- Event detail pages
- Category-based navigation
- Mobile-responsive design

**Sprint 4: Booking Flow**
- 2-step booking wizard
- Shopping cart with persistence
- Promo code validation
- Payment method selection
- Guest checkout

**Sprint 5: Payment Integration**
- M-Pesa STK Push integration
- Real-time payment status polling
- Stripe card payments
- Digital wallet payments
- Payment confirmation pages

**Sprint 6: Ticket Management**
- QR code ticket generation
- Ticket verification (public)
- Ticket check-in (organizers)
- Ticket transfer functionality
- PDF ticket downloads

**Sprint 7: Organizer Dashboard - Events**
- Event CRUD operations
- Multi-step event creation
- Image management (upload, order, delete)
- Ticket type builder
- Event status management (DRAFT/PUBLISHED/CANCELLED)

**Sprint 8: Organizer Dashboard - Promo Codes & Add-ons**
- Promo code creation (percentage/fixed discounts)
- Usage limits and validity dates
- Event add-ons management
- Active/inactive toggles

**Sprint 9: Analytics & Reporting**
- Dashboard analytics with charts
- Revenue and sales timelines
- Ticket breakdown visualizations
- CSV exports (attendees, sales)
- Event-specific analytics

**Sprint 10: Admin Dashboard**
- Organizer approval workflow
- Platform-wide analytics
- Event oversight
- User management

### 🟡 In Progress (Sprint 11: Polish & Optimization)

**Current Status: 20% Complete**

#### Remaining Tasks:
- ⏳ Testing framework setup (Vitest/Jest + React Testing Library)
- ⏳ E2E tests for critical flows (Playwright/Cypress)
- ⏳ Global error boundary implementation
- ⏳ Custom 404 and 500 error pages
- ⏳ Server-side middleware protection
- ⏳ SEO optimization (meta tags, structured data, sitemap)
- ⏳ Accessibility improvements (ARIA labels, keyboard navigation)
- ⏳ Performance optimization (bundle size, code splitting)
- ⏳ Error tracking integration (Sentry)
- ⏳ Analytics integration (Google Analytics)
- ⏳ PWA support (service worker, manifest)
- ⏳ Dark mode completion

---

## Key Features Deep Dive

### Authentication System
- **Multi-Role Support**: Organizers, admins, and attendees with separate auth flows
- **Unified Login**: Auto-detects user type and redirects accordingly
- **JWT Tokens**: Access and refresh tokens with automatic refresh
- **Persistent Sessions**: Tokens stored in localStorage with Zustand persist
- **Email Verification**: Required for organizers before account activation

### Payment Processing
- **M-Pesa STK Push**: Sends payment prompt to user's phone (Kenyan mobile money)
- **Real-Time Status**: Polls payment status every 4 seconds with cache-busting
- **Stripe Integration**: Card payments with 3D Secure support
- **Digital Wallet**: Instant payments for logged-in attendees
- **Error Handling**: Timeout, cancellation, insufficient funds, network errors

### Event Management
- **Multi-Step Creation**: Clean wizard flow for event creation
- **Image Management**: Upload multiple images with drag-and-drop, ordering, and primary selection
- **Ticket Tiers**: Create unlimited ticket types with different pricing and availability
- **Sales Control**: Set sales start/end dates for each ticket type
- **Status Workflow**: DRAFT → PUBLISHED → CANCELLED

### Analytics Dashboard
- **Visual Charts**: Line, bar, and pie charts using Recharts
- **Real-Time Metrics**: Revenue, bookings, attendees, events
- **Time-Series Data**: Sales timeline with date filtering
- **CSV Exports**: Download attendee and sales data for external analysis

---

## API Integration

**Base URL**: `http://localhost:8000/api`

The frontend integrates with 8 API endpoint modules:
1. **auth.ts** - Authentication (login, register, profile)
2. **events.ts** - Event management (CRUD, images, tickets, promos)
3. **bookings.ts** - Booking creation and management
4. **payments.ts** - M-Pesa, Stripe, Wallet payments
5. **analytics.ts** - Analytics data and exports
6. **admin.ts** - Admin operations
7. **tickets.ts** - Ticket verification and management
8. **attendees.ts** - Attendee operations

**API Client Features**:
- JWT authentication with auto-refresh
- Request/response interceptors
- Error handling with toast notifications
- Cache-busting for payment status
- FormData support for file uploads

---

## State Management

### Zustand Stores (Persisted in localStorage)
1. **authStore** - Organizer/admin authentication
   - User data, access/refresh tokens
   - Actions: `setAuth()`, `logout()`, `setUser()`, `setTokens()`

2. **attendeeAuthStore** - Attendee authentication
   - Attendee data, tokens, wallet balance
   - Actions: `setAttendee()`, `logout()`, `updateWalletBalance()`

3. **cartStore** - Shopping cart
   - Cart items, add-ons, promo codes
   - Actions: `addItem()`, `removeItem()`, `applyPromoCode()`, `getTotal()`

### TanStack Query
- Server state caching and synchronization
- 60s staleTime, no refetch on window focus
- Custom hooks for all API calls (5 hook files)

---

## Deployment

### Production Checklist

Before deploying to production:

- [ ] Set up production environment variables
- [ ] Update `NEXT_PUBLIC_API_URL` to production backend
- [ ] Configure Stripe production keys
- [ ] Set up error tracking (Sentry)
- [ ] Set up analytics (Google Analytics)
- [ ] Run Lighthouse audit and optimize
- [ ] Test on multiple devices and browsers
- [ ] Enable production optimizations
- [ ] Set up CDN for static assets
- [ ] Configure caching strategies

### Recommended Platform: Vercel

```bash
npm install -g vercel
vercel
```

**Alternative Platforms**: Netlify, AWS Amplify, Docker

---

## Testing

**Current Status**: Not implemented (planned for Sprint 11)

### Planned Testing Strategy
- **Unit Tests**: Utilities, helpers, validation schemas (Vitest/Jest)
- **Component Tests**: React components (React Testing Library)
- **Integration Tests**: API calls and hooks
- **E2E Tests**: Critical flows (Playwright/Cypress)
  - Booking flow
  - Payment process
  - Event creation
  - Admin approval workflow

---

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Android Chrome)

---

## Performance

- **Lighthouse Score Target**: 90+ for all metrics
- **Core Web Vitals**:
  - LCP (Largest Contentful Paint): < 2.5s
  - FID (First Input Delay): < 100ms
  - CLS (Cumulative Layout Shift): < 0.1
- **Bundle Size**: Optimized with code splitting
- **Images**: Next.js Image component with automatic optimization

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Follow TypeScript strict mode
- Use ESLint and Prettier
- Write meaningful commit messages
- Add TypeScript types for all functions
- Use Zod for runtime validation

---

## Documentation

- **Implementation Guide**: `docs/FRONTEND_IMPLEMENTATION_GUIDE.md` - Complete sprint-by-sprint guide
- **Project Status**: `docs/PROJECT_STATUS.md` - Current implementation status
- **Project Instructions**: `CLAUDE.md` - Development guidelines and patterns
- **API Documentation**: `../eventms/backend/docs/TukioHub_Complete_API.postman_collection.json`

---

## Project Statistics

- **Total TypeScript Files**: 132
- **React Components**: 66
- **API Endpoint Modules**: 8
- **Custom Hooks**: 5
- **Zustand Stores**: 3
- **Type Definition Files**: 6
- **Validation Schemas**: 5
- **shadcn/ui Components**: 21
- **App Router Pages**: ~30

---

## Backend Repository

The backend API is located at `../eventms/backend/`

**Backend Tech Stack**:
- Django 4.2 + Django REST Framework
- PostgreSQL database
- M-Pesa Daraja API integration
- JWT authentication
- Celery for async tasks

---

## Known Issues

1. **Middleware**: Client-side auth guards instead of server-side (planned for Sprint 11)
2. **Dark Mode**: Library installed but not fully implemented
3. **Testing**: No test framework configured (planned for Sprint 11)

See `docs/PROJECT_STATUS.md` for a complete list of remaining tasks.

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Support

For issues, questions, or contributions:
- **Issues**: Open an issue on GitHub
- **Documentation**: Check `docs/` folder
- **Backend Issues**: See `../eventms/backend/`

---

## Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [TanStack Query](https://tanstack.com/query) - Data fetching
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [Recharts](https://recharts.org/) - Chart library

---

**Built with ❤️ for the Kenyan event management community**
