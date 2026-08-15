"""
Celery tasks for analytics/reporting
"""

from celery import shared_task
from django.conf import settings
from django.utils import timezone
import logging

from apps.events.models import Event
from .services import AnalyticsService

logger = logging.getLogger(__name__)


@shared_task
def send_daily_reports_task():
    """
    Compile and email a daily registration/payment + reconciliation report
    for every event currently in progress (published, started, not yet
    ended). Run this task daily via Celery Beat.
    """
    admin_email = getattr(settings, 'REPORTS_ADMIN_EMAIL', None)
    if not admin_email:
        logger.warning("REPORTS_ADMIN_EMAIL not configured, skipping daily reports")
        return

    now = timezone.now()
    active_events = Event.objects.filter(
        status=Event.PUBLISHED,
        start_datetime__lte=now,
        end_datetime__gte=now,
    )

    logger.info(f"Compiling daily reports for {active_events.count()} active event(s)")

    for event in active_events:
        report_data = AnalyticsService.get_reconciliation_report(str(event.id))
        if not report_data:
            continue

        from apps.notifications.email_service import EmailService
        EmailService.send_daily_report(event, report_data, admin_email)
        logger.info(f"Daily report sent for event {event.title}")
