# TukioHub - Event Management Platform

## Project Overview

TukioHub is a full-stack event management platform targeting the Kenyan market. It supports event creation, ticket sales (M-Pesa + Stripe), QR-code ticketing, analytics dashboards, and multi-role authentication (organizers, attendees, admins).

## Repository Structure

```
tukiohub/
├── backend/          # Django REST API
├── frontend/         # Next.js web app
├── docker-compose.yml
└── CLAUDE.md
```

## Tech Stack

### Backend (`backend/`)
- **Framework:** Django 5.0.1 + Django REST Framework 3.16.1
- **Database:** PostgreSQL 14+
- **Cache/Broker:** Redis 5+
- **Task Queue:** Celery 5.3.4 + Celery Beat
- **Auth:** JWT (djangorestframework-simplejwt) with dual user model (User + Attendee)
- **Payments:** M-Pesa Daraja API, Stripe
- **Email/SMS:** SendGrid, Africa's Talking
- **Docs:** Swagger/OpenAPI via drf-yasg at `/swagger/`
- **Python:** 3.12+

### Frontend (`frontend/`)
- **Framework:** Next.js 16.1.0 (App Router) + React 19
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS 4 + shadcn/ui (New York style) + Radix UI
- **State:** Zustand 5 (persisted stores) + TanStack React Query 5
- **Forms:** React Hook Form 7 + Zod 4
- **Payments:** Stripe Elements, M-Pesa STK Push
- **Node:** 18+

## Architecture

### Backend Apps (`backend/apps/`)
- `users/` — Custom User model (organizers/admins) + Attendee model, JWT auth, wallet
- `events/` — Event CRUD, ticket types, promo codes, add-ons, public browsing
- `bookings/` — Booking flow, ticket generation (QR + PDF), check-in
- `payments/` — M-Pesa STK push, Stripe intents, transaction tracking
- `analytics/` — Dashboard stats, revenue timelines, demographics, CSV exports
- `notifications/` — SendGrid email + Africa's Talking SMS services

### Backend Config (`backend/config/`)
- `settings/base.py` — Shared settings
- `settings/development.py` — Dev overrides (DEBUG=True, CORS open, MailDev)
- `settings/production.py` — Production hardening (SSL, HSTS, Sentry)
- `urls.py` — Root URL routing
- `celery.py` — Celery app configuration

### Frontend Structure (`frontend/src/`)
- `app/` — Next.js App Router pages (route groups: auth, public, organizer, admin, attendee)
- `components/` — 66 React components (ui/, layout/, auth/, events/, booking/, payment/, dashboard/, admin/, wallet/)
- `lib/api/client.ts` — Axios instance with JWT interceptors and auto-refresh
- `lib/api/endpoints/` — API endpoint modules (auth, events, bookings, payments, tickets, analytics, attendees, admin)
- `lib/hooks/` — Custom hooks (useAuth, useEvents, useBooking, usePayment, useStripePayment)
- `lib/store/` — Zustand stores (authStore, attendeeAuthStore, cartStore)
- `lib/validations/` — Zod schemas
- `types/` — TypeScript interfaces

## Key Commands

### Backend
```bash
cd backend
pip install -r requirements/development.txt
python manage.py migrate
python manage.py runserver                    # API on :8000
celery -A config worker -l info               # Background tasks
celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

### Frontend
```bash
cd frontend
npm install
npm run dev       # Dev server on :3000
npm run build     # Production build
npm run start     # Production server on :3000
```

### Docker (full stack)
```bash
docker compose up --build        # All services
docker compose up -d             # Detached mode
docker compose down              # Stop all
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

## Environment Variables

### Backend (`backend/.env`)
Copy from `backend/.env.example`. Key variables:
- `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
- `REDIS_URL`, `CELERY_BROKER_URL`
- `MPESA_*` — M-Pesa Daraja credentials
- `STRIPE_*` — Stripe keys
- `SENDGRID_API_KEY`, `AFRICASTALKING_*`
- `CORS_ALLOWED_ORIGINS`

### Frontend (`frontend/.env.local`)
- `NEXT_PUBLIC_API_URL` — Backend API base URL (default: `http://localhost:8000/api`)

## API Endpoints (80+)

Key endpoint groups:
- `/api/auth/` — Organizer/admin auth (register, login, refresh, me)
- `/api/attendees/` — Attendee auth + wallet + tickets
- `/api/events/` — Organizer event CRUD
- `/api/public/events/` — Public event browsing (no auth)
- `/api/bookings/` — Booking creation, wallet payment, ticket operations
- `/api/payments/` — M-Pesa STK push, Stripe intents, webhooks
- `/api/analytics/` — Dashboard, revenue, demographics, CSV exports
- `/api/admin/` — Admin organizer/event/attendee management
- `/swagger/` — Interactive API docs

## Authentication

Dual-model JWT auth via `DualUserJWTAuthentication`:
- **Organizers/Admins:** `User` model (email-based login)
- **Attendees:** `Attendee` model (separate auth flow)
- JWT `user_type` claim distinguishes token type
- Access token: 1 hour, Refresh token: 7 days
- Frontend stores tokens in Zustand (persisted to localStorage)

## Conventions

- Backend uses Django conventions: snake_case, class-based views, model-serializer-view pattern
- Frontend uses Next.js App Router conventions: route groups with `()`, `page.tsx` files
- API responses follow DRF pagination: `{count, next, previous, results}`
- UUIDs for all primary keys
- Environment config via `python-decouple` (backend) and `NEXT_PUBLIC_` prefix (frontend)
- Commit messages: `type: description` (fix, feat, docs, refactor)

## Testing

```bash
cd backend
pytest                           # Run all tests
pytest apps/users/tests/         # Run specific app tests
pytest -v --tb=short             # Verbose with short tracebacks
```

## Common Patterns

- **Adding a new API endpoint:** Create serializer → view → wire in `urls.py` → document in Swagger
- **Adding a frontend page:** Create `app/(group)/route/page.tsx` → add API endpoint in `lib/api/endpoints/` → use React Query hook
- **Adding a payment method:** Implement service in `apps/payments/` → add view → add frontend payment component
