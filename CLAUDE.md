# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **TukioHub** - a comprehensive event management platform designed for the Kenyan market. TukioHub enables event organizers to advertise events, manage tickets, and process payments through M-Pesa and card payments. The system features a guest checkout flow (no attendee registration required), QR code-based ticket verification, and SMS/email confirmations.

**Key Differentiators:**
- M-Pesa STK Push integration for instant payments
- No attendee registration required
- Multi-tier ticketing (VVIP, VIP, Regular, Early Bird)
- QR code ticket generation and verification
- SMS and email delivery system

## Technology Stack

### Backend: Django (Python)
- **Framework**: Django 5.0 with Django REST Framework
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Database**: PostgreSQL
- **Cache**: Redis (django-redis)
- **Async Tasks**: Celery with Redis broker
- **Real-time**: Django Channels for WebSocket support
- **File Storage**: django-storages with AWS S3

### Frontend: React/Next.js
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **State Management**: Context API or Zustand
- **Forms**: React Hook Form

### Payment Integration
- **M-Pesa**: Safaricom Daraja API (STK Push)
- **Card Payments**: Stripe or Flutterwave

### Communication
- **Email**: SendGrid or AWS SES
- **SMS**: Africa's Talking

## Project Structure

```
eventms/
├── backend/                    # Django backend
│   ├── config/                 # Django settings (split: base, dev, prod)
│   ├── apps/
│   │   ├── users/              # Custom user model, authentication
│   │   ├── events/             # Event management, categories
│   │   ├── bookings/           # Booking system, tickets
│   │   ├── payments/           # M-Pesa, Stripe integration
│   │   ├── analytics/          # Reporting and analytics
│   │   └── notifications/      # Email/SMS services
│   └── requirements/           # Split requirements (base, dev, prod)
└── frontend/                   # Next.js frontend
    ├── app/                    # Next.js app router
    ├── components/             # Reusable components
    └── lib/                    # API client, utilities
```

## Common Development Commands

### Backend (Django)

```bash
# Setup virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements/development.txt

# Database operations
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser

# Run development server
python manage.py runserver

# Run with specific settings
python manage.py runserver --settings=config.settings.development

# Django shell (for database queries)
python manage.py shell
python manage.py shell_plus  # Enhanced shell (requires django-extensions)

# Database operations
python manage.py dbshell

# Create database backup
pg_dump -U event_user event_management_db > backup.sql

# Restore database
psql -U event_user event_management_db < backup.sql
```

### Testing

```bash
# Run all tests with pytest
pytest

# Run with coverage
pytest --cov=apps --cov-report=html

# Run specific test file
pytest apps/bookings/tests/test_services.py

# Run specific test class
pytest apps/users/tests/test_auth.py::TestUserAuthentication

# Run only unit tests
pytest -m unit

# Run only integration tests
pytest -m integration

# Verbose output
pytest -v
```

### Celery (Async Tasks)

```bash
# Start Celery worker
celery -A config worker -l info

# Start Celery Beat (scheduled tasks)
celery -A config beat -l info

# Monitor Celery tasks
celery -A config inspect active
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Run E2E tests
npm run test:e2e
```

## Key Architecture Components

### Authentication Flow
- Organizers and admins register with email verification
- JWT token-based authentication using djangorestframework-simplejwt
- Access token lifetime: 1 hour
- Refresh token lifetime: 7 days
- Attendees do NOT need accounts (guest checkout)

### Booking Workflow
1. User selects tickets on frontend
2. Backend creates PENDING booking and locks inventory (using `select_for_update()`)
3. 5-minute timeout set (Celery task)
4. User proceeds to M-Pesa or card payment
5. On successful payment:
   - Update booking status to CONFIRMED
   - Generate individual tickets with QR codes
   - Send confirmation email/SMS
6. On timeout: Release inventory and mark booking EXPIRED

### Payment Integration (M-Pesa)
- OAuth token generation with Redis caching (expires in 55 minutes)
- STK Push flow:
  1. Initiate STK Push with phone number, amount, reference
  2. User enters M-Pesa PIN on phone
  3. Daraja callback updates transaction status
  4. Celery task processes confirmation and triggers ticket generation
- Phone number format: 254XXXXXXXXX (Kenyan format)
- All M-Pesa operations in `payments/mpesa_service.py`

### Ticket Generation
- Uses `qrcode` library for QR code generation
- Uses `reportlab` for PDF generation
- Each ticket includes:
  - Event details (name, date, time, venue)
  - Attendee name
  - Ticket type
  - Large QR code (centered)
  - Booking reference
- QR code stores unique ticket_code for verification
- Tickets delivered via SendGrid (email) and Africa's Talking (SMS)

### Database Query Optimization
Django ORM best practices:
```python
# Use select_related for foreign keys
events = Event.objects.select_related('organizer').all()

# Use prefetch_related for reverse FK and M2M
events = Event.objects.prefetch_related('ticket_types').all()

# Use only() to fetch specific fields
events = Event.objects.only('title', 'start_datetime').all()

# Use defer() to exclude fields
events = Event.objects.defer('description').all()

# Lock inventory for concurrent bookings
ticket_type = TicketType.objects.select_for_update().get(id=ticket_id)
```

### Settings Management
- `config/settings/base.py` - Common settings
- `config/settings/development.py` - Dev overrides
- `config/settings/production.py` - Production overrides
- Use `--settings=config.settings.development` to specify

## Critical Business Logic

### Inventory Management
- Use database transactions (`@transaction.atomic`) for all booking operations
- Use `select_for_update()` to prevent race conditions and overselling
- Automatic inventory release on booking timeout (5 minutes)
- Track `quantity_sold` on TicketType model

### Promo Code Application
- Validate: is_active, not expired, usage_limit not exceeded
- Two discount types: PERCENTAGE, FIXED
- Apply discount using `apply_discount(amount)` method
- Increment `times_used` after successful booking

### Event Status Workflow
- DRAFT: Being created by organizer
- PUBLISHED: Visible to public
- CANCELLED: Event cancelled by organizer
- COMPLETED: Event has ended

### Payment Status Tracking
Transaction statuses:
- PENDING: Payment initiated
- COMPLETED: Payment successful
- FAILED: Payment failed or declined
- CANCELLED: Payment cancelled by user

## Important Implementation Notes

### Security Considerations
- Never store card details (PCI DSS compliance)
- Verify all webhook signatures (M-Pesa, Stripe)
- Use HTTPS only in production
- Implement rate limiting on public APIs
- Validate phone numbers (Kenyan format: 254XXXXXXXXX)
- Validate email formats

### Webhook Handling
- M-Pesa callback: No authentication (validate using request parameters)
- Stripe webhook: Verify signature using `stripe.Webhook.construct_event()`
- Process webhooks asynchronously using Celery
- Implement idempotency to prevent duplicate processing

### Error Handling Scenarios
**M-Pesa:**
- Timeout (user doesn't enter PIN): Mark transaction FAILED after timeout
- Cancelled by user: Update status to CANCELLED
- Insufficient funds: Handle result_code from callback
- Invalid phone number: Validate before initiating STK Push

**Booking:**
- Sold out tickets: Validate availability before creating booking
- Expired promo code: Validate in serializer
- Past event: Prevent booking for past events
- Concurrent bookings: Use database locking

### Performance Optimization
- Cache frequently accessed data (event lists, categories) in Redis
- Use pagination for all list endpoints
- Implement lazy loading for images
- Use CDN for static assets
- Database indexes on: slug, category+start_datetime, booking_reference, ticket_code

## Key Models

**User** (users/models.py)
- Custom user model extending AbstractUser
- Fields: email (unique), role (ORGANIZER/ADMIN), company_name, phone_number, verification_status

**Event** (events/models.py)
- UUID primary key, slug (unique, auto-generated)
- Venue with latitude/longitude (geocoded)
- Status workflow: DRAFT → PUBLISHED → COMPLETED/CANCELLED
- Properties: `is_upcoming()`, `is_sold_out()`, `available_tickets()`

**TicketType** (events/models.py)
- Multiple types per event (VVIP, VIP, REGULAR, etc.)
- Quantity tracking: quantity_available, quantity_sold
- Sales date range: sales_start_date, sales_end_date

**Booking** (bookings/models.py)
- UUID primary key, unique booking_reference
- Guest checkout: attendee_name, attendee_email, attendee_phone
- Payment tracking: payment_status, payment_method, transaction_id

**Ticket** (bookings/models.py)
- Individual tickets generated from bookings
- Unique ticket_code for QR verification
- Status: ACTIVE, USED, CANCELLED, TRANSFERRED
- checked_in_at timestamp for entry tracking

**Transaction** (payments/models.py)
- Payment tracking: amount, payment_method, mpesa_receipt_number
- Status: PENDING, COMPLETED, FAILED, CANCELLED
- Foreign key to Booking (can be null initially)

## Django Admin Customization

Customize admin for better management:
```python
# apps/events/admin.py
@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'organizer', 'start_datetime', 'status']
    list_filter = ['status', 'category', 'created_at']
    search_fields = ['title', 'description']
    prepopulated_fields = {'slug': ('title',)}
```

## Environment Variables

Key environment variables (see `.env.example`):
- Database: `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
- Redis: `REDIS_URL`
- M-Pesa: `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY`, `MPESA_SHORTCODE`, `MPESA_CALLBACK_URL`
- Email: `SENDGRID_API_KEY`, `DEFAULT_FROM_EMAIL`
- SMS: `AFRICASTALKING_USERNAME`, `AFRICASTALKING_API_KEY`
- Storage: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_STORAGE_BUCKET_NAME`
- Celery: `CELERY_BROKER_URL`

## Troubleshooting

### M-Pesa STK Push fails
- Verify shortcode and passkey are correct
- Check timestamp format (YYYYMMDDHHmmss)
- Ensure callback URL is publicly accessible (use ngrok for local dev)
- Verify phone number format (254XXXXXXXXX)

### Database connection errors
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify credentials in `.env`
- Ensure database user has correct permissions

### Celery tasks not running
- Check Celery worker is running: `celery -A config worker -l info`
- Check Redis connection: `redis-cli ping`
- View active tasks: `celery -A config inspect active`

### Email/SMS not sending
- Verify API keys in environment variables
- Check SendGrid/Africa's Talking account status
- Review Celery logs for failed tasks
- Check email templates are correctly formatted

## Deployment

### Production Checklist
```bash
# 1. Collect static files
python manage.py collectstatic --noinput

# 2. Run migrations
python manage.py migrate --settings=config.settings.production

# 3. Create superuser
python manage.py createsuperuser --settings=config.settings.production

# 4. Run security checks
python manage.py check --deploy --settings=config.settings.production

# 5. Test production settings locally
python manage.py runserver --settings=config.settings.production
```

### Server Management (systemd services)
```bash
# Check Django service status
sudo systemctl status event-api

# Restart Django service
sudo systemctl restart event-api

# Check Celery worker
sudo systemctl status celery

# Restart Celery
sudo systemctl restart celery

# View Django logs
sudo journalctl -u event-api -f

# View Celery logs
sudo journalctl -u celery -f
```

## API Documentation and Testing

### Swagger/OpenAPI Documentation

**Location**: http://localhost:8000/swagger/

The project uses `drf-yasg` for automatic API documentation. However, there's a **known incompatibility** between `drf-yasg` and `drf-nested-routers`:

**Issue**: Nested routes (e.g., `/api/events/{id}/tickets/`) cause `AssertionError: duplicate Parameters found` in Swagger schema generation.

**Solution Implemented** (in `config/urls.py`):
- Created `CustomSchemaGenerator` that filters out nested route endpoints from Swagger
- Added exception handling to gracefully skip endpoints with duplicate parameters
- Nested routes remain **fully functional** in the API, just excluded from Swagger docs

**Excluded from Swagger** (but working in API):
- `/api/events/{id}/tickets/` - Ticket type management
- `/api/events/{id}/promo-codes/` - Promo code management
- `/api/events/{id}/addons/` - Event add-on management

**Important**: If you add new nested routes in the future, they will automatically be excluded from Swagger but will work perfectly via the API.

### Postman Collection

**Location**: `backend/docs/TukioHub_API.postman_collection.json`

A comprehensive Postman collection is maintained with **all API endpoints** including nested routes that Swagger cannot document.

**Features**:
- 45+ requests organized into 6 folders
- Auto-saves tokens and IDs using test scripts
- Pre-configured authentication
- Ready-to-use examples

**Import Instructions**:
1. Open Postman
2. Click **Import**
3. Select `backend/docs/TukioHub_API.postman_collection.json`

**CRITICAL**: When adding new API endpoints or modifying existing ones, **ALWAYS update the Postman collection** to reflect the changes. See `backend/docs/POSTMAN_GUIDE.md` for usage instructions.

**Collection Structure**:
- Authentication (4 requests)
- Organizer - Events (11 requests)
- Organizer - Ticket Types (7 requests)
- Organizer - Promo Codes (6 requests)
- Organizer - Event Add-ons (5 requests)
- Public - Event Discovery (12 requests)

## Development Workflow

1. Create feature branch: `git checkout -b feature/ticket-generation`
2. Implement feature with tests
3. Run tests: `pytest --cov=apps`
4. **Update Postman collection** if API changes were made
5. Commit with descriptive message: `git commit -m "feat: implement ticket generation with QR codes"`
6. Push and create PR: `git push origin feature/ticket-generation`

## Reference Documentation

See detailed implementation guides:
- `sprints.md` - Sprint-by-sprint implementation instructions for TukioHub
- `claude-code-implementation-guide.md` - Detailed implementation guide with prompts
- `kenyan-event-management-system-roadmap.md` - Complete system roadmap and architecture

**Last Updated**: December 17, 2025
**Project**: TukioHub - Kenyan Event Management System
**Current Sprint**: Sprint 5 completed (Event Management System)
