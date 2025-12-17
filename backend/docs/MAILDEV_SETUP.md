# MailDev Setup for Local Email Testing

## Overview

MailDev is an SMTP server and web interface for viewing and testing emails during development. It captures all emails sent by the application and displays them in a user-friendly web interface, eliminating the need for actual email delivery during development.

## Features

- **SMTP Server**: Receives emails from Django on port 1025
- **Web Interface**: View emails at http://localhost:1080
- **HTML & Plain Text**: View both versions of emails
- **Email Details**: Inspect headers, attachments, and raw email source
- **No Configuration**: Works out of the box with zero configuration
- **Cross-Platform**: Runs on any system with Docker

## Installation & Setup

### Prerequisites

- Docker installed on your system
- Docker Compose V2 (comes with Docker Desktop)

### Step 1: Start MailDev

From the project root directory:

```bash
docker compose up -d
```

This starts MailDev in the background. You should see:

```
Container tukiohub_maildev  Started
```

### Step 2: Verify MailDev is Running

Check the container status:

```bash
docker ps | grep maildev
```

You should see the container running with ports 1025 and 1080 exposed.

### Step 3: Access the Web Interface

Open your browser and navigate to:

```
http://localhost:1080
```

You should see the MailDev web interface with an empty inbox.

## Django Configuration

The Django development settings are already configured to use MailDev:

**File**: `backend/config/settings/development.py`

```python
# Email Backend for Development (MailDev SMTP)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'localhost'
EMAIL_PORT = 1025
EMAIL_USE_TLS = False
EMAIL_USE_SSL = False
EMAIL_HOST_USER = ''
EMAIL_HOST_PASSWORD = ''
```

## Testing Email Functionality

### Method 1: Django Shell

```bash
cd backend
source ../venv/bin/activate
python manage.py shell --settings=config.settings.development
```

Then in the shell:

```python
from django.core.mail import send_mail

send_mail(
    'Test Subject',
    'Test message body',
    'from@example.com',
    ['to@example.com'],
    fail_silently=False,
)
```

### Method 2: Test Organizer Approval Email

1. Create a pending organizer via the registration API
2. Login as admin
3. Approve the organizer via the admin API
4. Check MailDev web interface for the approval email

```bash
# Create admin user if not exists
python manage.py createsuperuser --settings=config.settings.development

# Login as admin
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@tukiohub.com", "password": "YOUR_PASSWORD"}'

# Approve organizer (replace UUID and TOKEN)
curl -X POST http://localhost:8000/api/admin/organizers/<UUID>/approve-reject/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "approve"}'

# Check http://localhost:1080 for the email
```

## Using MailDev

### Viewing Emails

1. Open http://localhost:1080
2. All captured emails appear in the inbox
3. Click any email to view:
   - **HTML version**: Rendered email with styling
   - **Plain Text version**: Text-only version
   - **Headers**: Email headers (From, To, Subject, etc.)
   - **Source**: Raw email source

### Searching Emails

Use the search box to filter emails by:
- Subject
- From address
- To address
- Email content

### Deleting Emails

- **Delete Single Email**: Click the trash icon on an email
- **Delete All Emails**: Click "Delete All" button at the top

### Email Features

- **Auto-refresh**: Enable auto-refresh to see new emails immediately
- **Download**: Download emails as .eml files
- **Forward**: Forward emails to a real email address (for testing)

## Managing MailDev Container

### Start MailDev

```bash
docker compose up -d
```

### Stop MailDev

```bash
docker compose down
```

### View MailDev Logs

```bash
docker logs tukiohub_maildev -f
```

### Restart MailDev

```bash
docker compose restart maildev
```

## Troubleshooting

### Issue: Cannot connect to SMTP server

**Symptoms**: Django shows connection refused errors

**Solution**:
1. Verify MailDev is running: `docker ps | grep maildev`
2. Check port 1025 is not in use by another service
3. Restart MailDev: `docker compose restart maildev`

### Issue: Emails not appearing in MailDev

**Symptoms**: Django reports email sent successfully but nothing in MailDev

**Solution**:
1. Verify Django is using correct settings:
   ```bash
   python manage.py shell --settings=config.settings.development
   >>> from django.conf import settings
   >>> print(settings.EMAIL_HOST, settings.EMAIL_PORT)
   localhost 1025
   ```
2. Check MailDev logs: `docker logs tukiohub_maildev`
3. Verify web interface is accessible: http://localhost:1080

### Issue: Port 1080 or 1025 already in use

**Symptoms**: Docker fails to start with port binding error

**Solution**:
1. Find process using the port:
   ```bash
   lsof -ti:1080  # or :1025
   ```
2. Stop the process or change MailDev ports in `docker-compose.yml`

### Issue: Web interface not loading

**Symptoms**: http://localhost:1080 shows connection refused

**Solution**:
1. Verify container is running: `docker ps | grep maildev`
2. Check container health: `docker inspect tukiohub_maildev | grep Health`
3. View container logs: `docker logs tukiohub_maildev`

## Production Considerations

**IMPORTANT**: MailDev is for development only. Never use it in production.

For production:
- Use a real email service (SendGrid, AWS SES, etc.)
- Update `config/settings/production.py` with production email backend
- Configure proper SPF, DKIM, and DMARC records for your domain

## Alternative: Console Email Backend

If you prefer to view emails in the console instead of MailDev:

**File**: `backend/config/settings/development.py`

```python
# Email Backend for Development (Console)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```

This will print all emails to the Django console instead of sending them to MailDev.

## Additional Resources

- MailDev GitHub: https://github.com/maildev/maildev
- MailDev Docker Hub: https://hub.docker.com/r/maildev/maildev
- Django Email Documentation: https://docs.djangoproject.com/en/5.0/topics/email/

---

**Last Updated**: December 17, 2025
**MailDev Version**: latest (via Docker)
