# Running Celery Workers and Beat Scheduler for Production

## Overview
TukioHub uses Celery for background task processing and periodic tasks. The payment system requires both a Celery worker and Celery Beat scheduler to function properly.

## Required Services

### 1. Redis Server
```bash
# Start Redis (required for caching and Celery broker)
redis-server
```

### 2. Celery Worker
```bash
# Start Celery worker to process async tasks
cd /home/bonnie/Projects/eventms/backend
source venv/bin/activate
celery -A config worker -l info
```

### 3. Celery Beat Scheduler
```bash
# Start Celery Beat for periodic tasks
cd /home/bonnie/Projects/eventms/backend
source venv/bin/activate
celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

## Production Deployment Commands

For production deployment, you'll typically run these as separate services:

### Using systemd (recommended for production)

Create systemd service files:

**/etc/systemd/system/tukiohub-celery-worker.service**
```ini
[Unit]
Description=TukioHub Celery Worker
After=network.target redis.service

[Service]
Type=forking
User=www-data
Group=www-data
EnvironmentFile=/path/to/your/env/file
WorkingDirectory=/home/bonnie/Projects/eventms/backend
ExecStart=/home/bonnie/Projects/eventms/backend/venv/bin/celery -A config worker --loglevel=info --pidfile=/var/run/celery/worker.pid
ExecReload=/bin/kill -HUP $MAINPID
KillSignal=SIGTERM
TimeoutStopSec=60
Restart=always

[Install]
WantedBy=multi-user.target
```

**/etc/systemd/system/tukiohub-celery-beat.service**
```ini
[Unit]
Description=TukioHub Celery Beat
After=network.target redis.service

[Service]
Type=forking
User=www-data
Group=www-data
EnvironmentFile=/path/to/your/env/file
WorkingDirectory=/home/bonnie/Projects/eventms/backend
ExecStart=/home/bonnie/Projects/eventms/backend/venv/bin/celery -A config beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler --pidfile=/var/run/celery/beat.pid
ExecReload=/bin/kill -HUP $MAINPID
KillSignal=SIGTERM
TimeoutStopSec=60
Restart=always

[Install]
WantedBy=multi-user.target
```

Then enable and start the services:
```bash
sudo systemctl enable tukiohub-celery-worker
sudo systemctl enable tukiohub-celery-beat
sudo systemctl start tukiohub-celery-worker
sudo systemctl start tukiohub-celery-beat
```

### Using Docker Compose (alternative)

If using Docker, add to your `docker-compose.yml`:

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  celery-worker:
    build: .
    command: celery -A config worker -l info
    environment:
      - REDIS_URL=redis://redis:6379/0
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/0
    depends_on:
      - redis
      - db

  celery-beat:
    build: .
    command: celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
    environment:
      - REDIS_URL=redis://redis:6379/0
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/0
    depends_on:
      - redis
      - db

  web:
    build: .
    ports:
      - "8000:8000"
    depends_on:
      - redis
      - db
```

## Periodic Tasks Setup

The following periodic tasks are automatically configured:

1. **Check Pending M-Pesa Transactions** (runs every 5 minutes)
   - Checks status of pending M-Pesa transactions that are older than 15 minutes
   - Updates transaction status based on M-Pesa response
   - Triggers booking confirmation for successful payments

2. **Clean Up Old Pending Transactions** (runs every 24 hours)
   - Marks transactions pending for more than 24 hours as CANCELLED
   - Prevents accumulation of stale pending transactions

## Monitoring

### Check running tasks:
```bash
# Monitor Celery worker logs
tail -f /var/log/celery/worker.log

# Check active tasks
celery -A config inspect active
```

### Django Admin:
- Access periodic tasks in Django admin under "Celery Beat" > "Periodic tasks"
- You can enable/disable tasks or modify their schedules from the admin interface

## Troubleshooting

### If Celery Beat doesn't start:
- Ensure the database migrations have been run
- Verify that `django_celery_beat` is in `INSTALLED_APPS`
- Check that the periodic tasks exist in the database

### If tasks aren't running:
- Check that both worker and beat services are running
- Verify Redis is accessible
- Check logs for error messages

### In development:
For development, run these commands in separate terminals:
```bash
# Terminal 1: Redis (if not already running)
redis-server

# Terminal 2: Django development server
python manage.py runserver

# Terminal 3: Celery worker
celery -A config worker -l info

# Terminal 4: Celery Beat
celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```