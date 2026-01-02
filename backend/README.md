# TukioHub Backend - Event Management API

[![Django](https://img.shields.io/badge/Django-5.0.1-green)](https://www.djangoproject.com/)
[![DRF](https://img.shields.io/badge/DRF-3.16.1-red)](https://www.django-rest-framework.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue)](https://www.postgresql.org/)
[![Celery](https://img.shields.io/badge/Celery-5.3.4-green)](https://docs.celeryproject.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A comprehensive Django REST API for TukioHub, a modern event management platform designed for the Kenyan market. Features include multi-role authentication, M-Pesa/Stripe/Wallet payments, ticketing with QR codes, analytics, and background task processing.

**Current Status**: ✅ Feature-Complete | ⚠️ Deployment Infrastructure Needed

---

## Features

### Core Functionality
- **Dual User Authentication**: Separate flows for organizers/admins and attendees
- **Event Management**: Complete CRUD with ticket types, promo codes, and add-ons
- **Payment Processing**: M-Pesa STK Push, Stripe, and digital wallet integration
- **Ticketing System**: QR code generation, verification, check-in, and transfer
- **Analytics & Reporting**: Dashboard stats, charts data, CSV exports
- **Email Notifications**: Professional HTML templates with PDF ticket attachments
- **Background Tasks**: Celery for async operations (emails, reminders, payment checks)
- **Admin Interface**: Highly customized Django admin for managing the platform
- **API Documentation**: Swagger/OpenAPI and Postman collection (80+ endpoints)

### Payment Methods
1. **M-Pesa STK Push**: Kenyan mobile money integration via Daraja API
2. **Stripe**: International card payments with 3D Secure
3. **Digital Wallet**: Instant payments from attendee wallet balance

### User Roles
- **Organizers**: Create and manage events, view analytics
- **Admins**: Platform oversight, organizer approval, analytics
- **Attendees**: Book tickets, manage wallet, view tickets

---

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| **Core** | Django | 5.0.1 |
| **API** | Django REST Framework | 3.16.1 |
| **Database** | PostgreSQL | 14+ |
| **Caching** | Redis | 7.0+ |
| **Task Queue** | Celery | 5.3.4 |
| **Scheduler** | Celery Beat | 2.5.0 |
| **Auth** | Simple JWT | 5.3.1 |
| **Real-time** | Django Channels | 4.0.0 |
| **Email** | SendGrid | via requests |
| **SMS** | Africa's Talking | via requests |
| **Payments** | M-Pesa Daraja API | v3.0 |
| **Payments** | Stripe | Latest |
| **Storage** | django-storages (S3) | 1.14.4 |
| **API Docs** | drf-yasg | 1.21.8 |
| **Testing** | pytest + pytest-django | 8.0.0 |

---

## Quick Start

### Prerequisites

- Python 3.10+
- PostgreSQL 14+
- Redis 7.0+

### Installation

1. **Clone and navigate to backend**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Create PostgreSQL database**
   ```bash
   createdb tukiohub_db
   # Or using psql:
   psql -U postgres -c "CREATE DATABASE tukiohub_db;"
   ```

6. **Run migrations**
   ```bash
   python manage.py migrate
   ```

7. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

8. **Start development server**
   ```bash
   python manage.py runserver
   ```

9. **Start Redis (required for Celery)**
   ```bash
   # Check if Redis is running
   redis-cli ping  # Should return: PONG

   # If not running, start Redis:
   sudo systemctl start redis      # Linux
   brew services start redis       # macOS
   ```

10. **Start Celery worker** (in a separate terminal)
    ```bash
    source venv/bin/activate
    celery -A config worker -l info
    ```

11. **Start Celery Beat** (optional, for scheduled tasks)
    ```bash
    celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
    ```

### Access Points

- **API Root**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/
- **Swagger UI**: http://localhost:8000/swagger/
- **ReDoc**: http://localhost:8000/redoc/

---

## Project Structure

```
backend/
├── apps/                           # Django Applications (5 apps)
│   ├── users/                     # Authentication & user management
│   │   ├── models.py             # User, Attendee, WalletTransaction
│   │   ├── views.py              # Auth views & endpoints
│   │   ├── serializers.py        # User serializers
│   │   ├── authentication.py     # Custom JWT authentication
│   │   ├── permissions.py        # Custom permissions
│   │   └── tests/                # User tests
│   │
│   ├── events/                    # Event management
│   │   ├── models.py             # Event, TicketType, PromoCode, EventAddOn
│   │   ├── views.py              # Event CRUD endpoints
│   │   ├── serializers.py        # Event serializers
│   │   ├── filters.py            # Event filtering
│   │   └── tests/                # Event tests
│   │
│   ├── bookings/                  # Booking & ticketing
│   │   ├── models.py             # Booking, BookingItem, Ticket
│   │   ├── views.py              # Booking endpoints
│   │   ├── ticket_service.py     # QR & PDF generation
│   │   └── tasks.py              # Celery tasks (tickets, reminders)
│   │
│   ├── payments/                  # Payment processing
│   │   ├── models.py             # Transaction
│   │   ├── views.py              # Payment endpoints
│   │   ├── mpesa_service.py      # M-Pesa integration
│   │   ├── stripe_service.py     # Stripe integration
│   │   └── tasks.py              # Payment processing tasks
│   │
│   ├── analytics/                 # Analytics & reporting
│   │   ├── views.py              # Analytics endpoints
│   │   ├── services.py           # Analytics calculations
│   │   └── serializers.py        # Analytics serializers
│   │
│   └── notifications/             # Email & SMS
│       ├── email_service.py      # SendGrid integration
│       ├── sms_service.py        # Africa's Talking integration
│       └── tasks.py              # Notification tasks
│
├── config/                        # Project configuration
│   ├── settings/                 # Split settings
│   │   ├── base.py              # Common settings
│   │   ├── development.py       # Dev-specific settings
│   │   └── production.py        # Production settings
│   ├── celery.py                # Celery configuration
│   ├── urls.py                  # URL routing
│   ├── wsgi.py                  # WSGI application
│   └── asgi.py                  # ASGI application
│
├── templates/                     # HTML templates
│   └── emails/                   # Email templates (10+)
│       ├── booking_confirmation.html
│       ├── event_reminder.html
│       ├── ticket_transfer.html
│       ├── password_reset_email.html
│       ├── wallet_deposit_confirmation.html
│       └── ...
│
├── media/                         # User-uploaded files
│   ├── event_images/
│   ├── profile_images/
│   ├── qr_codes/
│   └── tickets/
│
├── docs/                          # Documentation
│   ├── TukioHub_Complete_API.postman_collection.json
│   ├── PROJECT_STATUS.md         # Current project status
│   ├── ANALYTICS_GUIDE.md
│   ├── DATABASE_SETUP.md
│   └── WALLET_PAYMENT_GUIDE.md
│
├── manage.py                      # Django management script
├── pytest.ini                     # pytest configuration
├── .coveragerc                    # Coverage configuration
├── requirements.txt               # Production dependencies
└── update_postman_collection.py   # Postman update script
```

---

## API Endpoints

### Total Endpoints: 80+

Full API documentation available at:
- **Swagger UI**: http://localhost:8000/swagger/
- **Postman Collection**: `docs/TukioHub_Complete_API.postman_collection.json`

#### Public Endpoints (No Auth Required)
```
GET    /api/public/events/                         # Browse events
GET    /api/public/events/<slug>/                  # Event details
GET    /api/public/events/featured/                # Featured events
GET    /api/public/events/categories/              # Event categories
GET    /api/public/events/search/                  # Search events
POST   /api/bookings/create/                       # Create booking (guest checkout)
POST   /api/bookings/tickets/verify/               # Verify ticket code
GET    /api/payments/status/<reference>/           # Payment status
```

#### Authentication
```
POST   /api/auth/register/                         # Organizer registration
POST   /api/auth/login/                            # Organizer login
POST   /api/auth/unified-login/                    # Unified login
POST   /api/auth/refresh/                          # Refresh JWT token
GET    /api/auth/me/                               # Get user profile
POST   /api/attendees/register/                    # Attendee registration
POST   /api/attendees/login/                       # Attendee login
```

#### Event Management (Organizer)
```
GET/POST    /api/events/                           # List/create events
GET/PUT/DELETE /api/events/<id>/                   # Event CRUD
POST   /api/events/<id>/publish/                   # Publish event
POST   /api/events/<id>/cancel/                    # Cancel event
GET/POST    /api/events/<id>/tickets/              # Manage ticket types
GET/POST    /api/events/<id>/promo-codes/          # Manage promo codes
GET/POST    /api/events/<id>/addons/               # Manage add-ons
```

#### Payments
```
POST   /api/payments/mpesa/initiate/               # M-Pesa STK Push
POST   /api/payments/mpesa/callback/               # M-Pesa webhook
POST   /api/payments/stripe/create-intent/         # Stripe Payment Intent
POST   /api/payments/stripe/webhook/               # Stripe webhook
GET    /api/payments/transactions/                 # List transactions
```

#### Wallet
```
GET    /api/attendees/wallet/                      # Get wallet balance
POST   /api/attendees/wallet/                      # Top up wallet (M-Pesa)
POST   /api/attendees/wallet/card-topup/           # Top up wallet (Card)
GET    /api/attendees/tickets/                     # Get attendee tickets
```

#### Analytics
```
GET    /api/analytics/dashboard/                   # Organizer dashboard
GET    /api/analytics/quick-stats/                 # Quick stats
GET    /api/analytics/events/<id>/overview/        # Event analytics
GET    /api/analytics/events/<id>/sales-timeline/  # Sales over time
GET    /api/analytics/events/<id>/export/attendees/ # Export CSV
```

#### Admin
```
GET    /api/admin/organizers/                      # List organizers
POST   /api/admin/organizers/<id>/approve-reject/  # Approve/reject
GET    /api/admin/dashboard/                       # Admin dashboard
GET    /api/admin/analytics/                       # Platform analytics
GET    /api/admin/events/                          # All platform events
```

---

## Database Schema

### 5 Django Apps with 15+ Models

**Users App**:
- User (organizers/admins with verification)
- Attendee (event attendees with wallet)
- WalletTransaction (transaction history)
- PasswordReset, EmailVerification

**Events App**:
- Event (with status, categories, capacity)
- TicketType (pricing tiers)
- PromoCode (discount codes)
- EventAddOn (event extras)
- EventImage (multiple images)

**Bookings App**:
- Booking (with payment status)
- BookingItem (ticket line items)
- BookingAddOn (add-on line items)
- Ticket (with QR codes and check-in tracking)

**Payments App**:
- Transaction (M-Pesa, Stripe, Wallet)

**Analytics App**:
- Computed on-the-fly from existing data

---

## Celery Background Tasks

### Why Celery is Required

Celery handles critical asynchronous operations:

1. **Email Notifications**:
   - Booking confirmations with PDF tickets
   - Event reminders (24hrs before)
   - Wallet deposit confirmations
   - Password reset emails

2. **Payment Processing**:
   - Process successful payments
   - Auto-check pending transactions (every 5 minutes)
   - Cleanup old pending transactions

3. **Booking Management**:
   - Auto-expire unpaid bookings (5 minutes)
   - Generate and email tickets
   - Schedule event reminders

4. **Event Management**:
   - Auto-complete finished events
   - Cleanup old draft events

### Running Celery

**Development**:
```bash
# Terminal 1: Start worker
celery -A config worker -l info

# Terminal 2: Start beat scheduler (for periodic tasks)
celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

**Production**:
See [CELERY_SETUP.md](CELERY_SETUP.md) for systemd/supervisor setup.

### Periodic Task Schedule

```python
'auto-complete-events': Every hour
'auto-complete-finished-events': Every hour
'cleanup-draft-events': Weekly
'schedule-event-reminders': Daily
'cleanup-expired-bookings': Weekly
'check-pending-transactions': Every 5 minutes
'cleanup-old-pending-transactions': Daily
```

---

## Environment Variables

### Required Configuration

Create a `.env` file from `.env.example`:

```env
# Django
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DJANGO_SETTINGS_MODULE=config.settings.development

# Database
DB_NAME=tukiohub_db
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/0

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
DEFAULT_FROM_EMAIL=noreply@tukiohub.co.ke

# SMS (Africa's Talking)
AFRICAS_TALKING_USERNAME=sandbox
AFRICAS_TALKING_API_KEY=your-api-key

# M-Pesa
MPESA_ENVIRONMENT=sandbox  # or production
MPESA_CONSUMER_KEY=your-consumer-key
MPESA_CONSUMER_SECRET=your-consumer-secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your-passkey
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/callback/

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000
```

Full list of variables in `.env.example`.

---

## Development

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=apps --cov-report=html

# Run specific test file
pytest apps/users/tests/test_api.py

# Run with verbose output
pytest -v

# View coverage report
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
```

**Current Test Coverage**: ~40%
- Users app: 60% coverage
- Events app: 50% coverage
- Bookings, Payments, Analytics: 0% coverage (tests needed)

### Django Management Commands

```bash
# Make migrations
python manage.py makemigrations

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic

# Django shell
python manage.py shell

# Django shell with models auto-imported
python manage.py shell_plus
```

### Code Quality Tools

```bash
# Format code with Black
black .

# Check code style with Flake8
flake8

# Run Pylint
pylint apps/

# Sort imports with isort
isort .
```

---

## Project Status

### ✅ Complete (95%)

- Authentication & user management (dual user system)
- Event management (CRUD, tickets, promos, add-ons)
- Public event discovery (search, filters, categories)
- Booking & ticketing (guest checkout, QR codes)
- Payment integration (M-Pesa, Stripe, Wallet)
- Email notifications (10+ professional templates)
- SMS notifications
- Analytics & reporting (dashboard, exports)
- Celery background tasks
- Admin interface (highly customized)
- API documentation (Swagger + Postman)

### ⚠️ Partial (40-80%)

- Testing (40% coverage, payments not tested)
- Security (80% - missing rate limiting, CAPTCHA)
- Monitoring (30% - Sentry configured but not implemented)

### ❌ Not Started (0%)

- Deployment infrastructure (Docker, gunicorn, nginx)
- CI/CD pipeline
- Advanced monitoring (APM, metrics)

**See [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) for detailed status.**

---

## Deployment

### Pre-Deployment Checklist

- [ ] Add Dockerfile and docker-compose.yml
- [ ] Configure gunicorn for WSGI server
- [ ] Set up nginx for reverse proxy
- [ ] Implement rate limiting (DRF throttling)
- [ ] Add security headers (CSP, X-Frame-Options)
- [ ] Complete Sentry integration for error tracking
- [ ] Add CAPTCHA to registration
- [ ] Write comprehensive tests (target 80%+ coverage)
- [ ] Set up health check endpoint
- [ ] Configure database backups
- [ ] Add uptime monitoring

### Production Settings

Update `.env` for production:
```env
DEBUG=False
DJANGO_SETTINGS_MODULE=config.settings.production
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
MPESA_ENVIRONMENT=production
```

### Recommended Hosting

- **Application**: DigitalOcean App Platform, AWS ECS, or Heroku
- **Database**: AWS RDS PostgreSQL or DigitalOcean Managed Database
- **Redis**: AWS ElastiCache or DigitalOcean Managed Redis
- **Storage**: AWS S3 for media files
- **Email**: SendGrid
- **Monitoring**: Sentry + New Relic

---

## API Integration

### Frontend Repository

The Next.js 14 frontend is located at `../event-frontend/`

**Frontend Features**:
- Next.js 14 with App Router
- TypeScript + Tailwind CSS
- TanStack Query for API calls
- Zustand for state management
- Full integration with all backend endpoints

---

## Documentation

- **Project Status**: [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md)
- **API Documentation**: [docs/TukioHub_Complete_API.postman_collection.json](docs/TukioHub_Complete_API.postman_collection.json)
- **Analytics Guide**: [docs/ANALYTICS_GUIDE.md](docs/ANALYTICS_GUIDE.md)
- **Wallet Guide**: [docs/WALLET_PAYMENT_GUIDE.md](docs/WALLET_PAYMENT_GUIDE.md)
- **Database Setup**: [docs/DATABASE_SETUP.md](docs/DATABASE_SETUP.md)
- **Celery Setup**: [CELERY_SETUP.md](CELERY_SETUP.md)

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow PEP 8 guidelines
- Use Black for code formatting (line length: 100)
- Use isort for import sorting
- Write docstrings for all functions/classes
- Add type hints where applicable
- Write tests for new features

---

## Troubleshooting

### Common Issues

**1. Celery tasks not executing**:
```bash
# Make sure Redis is running
redis-cli ping

# Start Celery worker
celery -A config worker -l info
```

**2. Database connection errors**:
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check database exists
psql -U postgres -l | grep tukiohub
```

**3. M-Pesa not working**:
- Verify `MPESA_CALLBACK_URL` is publicly accessible
- Check Daraja portal for API credentials
- Ensure environment is set correctly (sandbox/production)

**4. Emails not sending**:
- Verify SendGrid API key is valid
- Check Celery worker is running
- Check logs for email errors

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Support

For issues or questions:
- **Backend Issues**: Open an issue on GitHub
- **Frontend Issues**: See `../event-frontend/`
- **Documentation**: Check `docs/` folder

---

## Acknowledgments

- [Django](https://www.djangoproject.com/) - Web framework
- [Django REST Framework](https://www.django-rest-framework.org/) - API framework
- [Celery](https://docs.celeryproject.org/) - Task queue
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Redis](https://redis.io/) - Caching and message broker
- [SendGrid](https://sendgrid.com/) - Email service
- [Stripe](https://stripe.com/) - Payment processing
- [Safaricom Daraja API](https://developer.safaricom.co.ke/) - M-Pesa integration

---

**Built with ❤️ for the Kenyan event management community**
