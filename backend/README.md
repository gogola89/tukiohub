# TukioHub Backend

Django 5.0 REST API for TukioHub - Kenyan Event Management System

## Setup

### Prerequisites

- Python 3.10+
- PostgreSQL 12+
- Redis 6+

### Installation

1. Create and activate virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements/development.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Create PostgreSQL database:
```bash
createdb tukiohub_db
# Or using psql:
# psql -U postgres -c "CREATE DATABASE tukiohub_db;"
```

5. Run migrations:
```bash
python manage.py migrate
```

6. Create superuser:
```bash
python manage.py createsuperuser
```

7. Run development server:
```bash
python manage.py runserver
```

## Development

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=apps --cov-report=html

# Run specific test file
pytest apps/users/tests/test_auth.py

# Run with verbose output
pytest -v
```

### Code Quality

```bash
# Format code with Black
black .

# Check code style with Flake8
flake8

# Run Pylint
pylint apps/
```

### Celery

Start Celery worker:
```bash
celery -A config worker -l info
```

Start Celery Beat (scheduled tasks):
```bash
celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

For production deployment, see [CELERY_SETUP.md](CELERY_SETUP.md) for detailed instructions on running Celery workers and beat scheduler as system services.

### Django Commands

```bash
# Create new app
python manage.py startapp app_name

# Make migrations
python manage.py makemigrations

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic

# Run shell
python manage.py shell

# Run shell_plus (with django-extensions)
python manage.py shell_plus
```

## Project Structure

```
backend/
├── apps/                   # Django applications
│   ├── users/             # User authentication & management
│   ├── events/            # Event management
│   ├── bookings/          # Booking & ticketing
│   ├── payments/          # Payment processing (M-Pesa, Stripe)
│   ├── analytics/         # Analytics & reporting
│   └── notifications/     # Email & SMS notifications
├── config/                # Project configuration
│   ├── settings/          # Settings (base, development, production)
│   ├── celery.py          # Celery configuration
│   ├── urls.py            # URL routing
│   ├── wsgi.py            # WSGI application
│   └── asgi.py            # ASGI application
├── logs/                  # Application logs
├── media/                 # Uploaded files
├── staticfiles/           # Collected static files
├── requirements/          # Python dependencies
│   ├── base.txt
│   ├── development.txt
│   └── production.txt
├── manage.py              # Django management script
├── .env                   # Environment variables (not in git)
├── .env.example           # Example environment variables
├── pytest.ini             # Pytest configuration
├── .pylintrc              # Pylint configuration
├── .flake8                # Flake8 configuration
├── .coveragerc            # Coverage configuration
└── pyproject.toml         # Black & isort configuration
```

## API Documentation

Once the server is running, access API documentation at:
- Swagger UI: http://localhost:8000/swagger/
- ReDoc: http://localhost:8000/redoc/

## Environment Variables

See `.env.example` for all available environment variables.

Key variables:
- `ENVIRONMENT`: development, staging, or production
- `SECRET_KEY`: Django secret key
- `DB_*`: Database configuration
- `REDIS_URL`: Redis connection URL
- `MPESA_*`: M-Pesa Daraja API credentials
- `STRIPE_*`: Stripe payment gateway credentials
- `SENDGRID_API_KEY`: SendGrid email API key
- `AFRICASTALKING_*`: Africa's Talking SMS API credentials

## Settings

The project uses split settings:
- `base.py`: Common settings
- `development.py`: Development-specific settings
- `production.py`: Production-specific settings

The active settings file is determined by the `ENVIRONMENT` variable in `.env`.

## License

Proprietary - TukioHub
