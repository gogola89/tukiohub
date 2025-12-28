"""
Celery tasks for event management
"""

from celery import shared_task
from django.utils import timezone
from django.db.models import Max
import logging

logger = logging.getLogger(__name__)


@shared_task
def auto_complete_events_task():
    """
    Auto-complete events when ticket sales have ended

    This task runs periodically (via Celery Beat) and changes event status
    from PUBLISHED to COMPLETED when the latest ticket sales end date has passed.

    This allows organizers to see which events have finished selling tickets
    and helps with analytics and reporting.
    """
    from .models import Event, TicketType

    try:
        now = timezone.now()

        # Find all PUBLISHED events
        published_events = Event.objects.filter(status=Event.STATUS_PUBLISHED)

        completed_count = 0
        for event in published_events:
            # Get the latest sales_end_date from all ticket types for this event
            latest_sales_end = event.ticket_types.aggregate(
                Max('sales_end_date')
            )['sales_end_date__max']

            # If event has ticket types and all sales have ended
            if latest_sales_end and latest_sales_end <= now:
                event.status = Event.STATUS_COMPLETED
                event.save(update_fields=['status', 'updated_at'])
                completed_count += 1
                logger.info(
                    f"Event '{event.title}' (ID: {event.id}) auto-completed - "
                    f"all ticket sales ended on {latest_sales_end}"
                )

        logger.info(
            f"Auto-complete task finished: {completed_count} events completed out of "
            f"{published_events.count()} published events"
        )
        return completed_count

    except Exception as e:
        logger.error(f"Error in auto_complete_events_task: {str(e)}", exc_info=True)
        raise


@shared_task
def auto_complete_finished_events_task():
    """
    Auto-complete events when the event itself has ended (based on end_datetime)

    This task runs periodically (via Celery Beat) and changes event status
    from PUBLISHED to COMPLETED when the event's end_datetime has passed.
    """
    from .models import Event

    try:
        now = timezone.now()

        # Find all PUBLISHED events that have ended
        events_to_complete = Event.objects.filter(
            status=Event.STATUS_PUBLISHED,
            end_datetime__lte=now
        )

        completed_count = events_to_complete.count()

        if completed_count > 0:
            # Update all matching events
            events_to_complete.update(
                status=Event.STATUS_COMPLETED,
                updated_at=now
            )

            logger.info(
                f"Auto-completed {completed_count} events that have ended"
            )

            # Log individual events for auditing
            for event in events_to_complete:
                logger.info(
                    f"Event '{event.title}' (ID: {event.id}) auto-completed - "
                    f"ended on {event.end_datetime}"
                )
        else:
            logger.info("No events to auto-complete")

        return completed_count

    except Exception as e:
        logger.error(f"Error in auto_complete_finished_events_task: {str(e)}", exc_info=True)
        raise


@shared_task
def cleanup_draft_events_task():
    """
    Cleanup old draft events that haven't been published

    This task runs weekly (via Celery Beat) and deletes draft events
    that are older than 30 days and haven't been modified.
    """
    from .models import Event
    from datetime import timedelta

    try:
        cutoff_date = timezone.now() - timedelta(days=30)

        # Find old draft events
        old_drafts = Event.objects.filter(
            status=Event.STATUS_DRAFT,
            updated_at__lt=cutoff_date
        )

        count = old_drafts.count()

        if count > 0:
            logger.info(f"Deleting {count} old draft events (older than 30 days)")
            old_drafts.delete()
            logger.info(f"Deleted {count} old draft events")
        else:
            logger.info("No old draft events to cleanup")

        return count

    except Exception as e:
        logger.error(f"Error in cleanup_draft_events_task: {str(e)}", exc_info=True)
        raise
