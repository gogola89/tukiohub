"""
Celery tasks for booking management
"""

from celery import shared_task
from django.utils import timezone
from django.db import transaction
import logging

from .models import Booking, Ticket
from .services import BookingService
from .ticket_service import TicketService

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def expire_booking_task(self, booking_id):
    """
    Expire booking if not paid within timeout period

    Args:
        booking_id (str): UUID of the booking
    """
    try:
        booking = Booking.objects.get(id=booking_id)

        # Check if booking is still pending
        if booking.status == Booking.STATUS_PENDING:
            # Check if expired
            if booking.expires_at and booking.expires_at <= timezone.now():
                logger.info(f"Expiring booking {booking.booking_reference}")
                BookingService.cancel_booking(
                    booking_id=booking.id,
                    reason="Booking expired - payment not received within timeout period"
                )
                logger.info(f"Booking {booking.booking_reference} expired successfully")
            else:
                logger.info(f"Booking {booking.booking_reference} not yet expired, skipping")
        else:
            logger.info(f"Booking {booking.booking_reference} already processed (status: {booking.status})")

    except Booking.DoesNotExist:
        logger.error(f"Booking {booking_id} not found for expiration")
    except Exception as e:
        logger.error(f"Error expiring booking {booking_id}: {str(e)}", exc_info=True)
        # Retry task
        raise self.retry(exc=e, countdown=60)


@shared_task(bind=True, max_retries=3)
def generate_and_send_tickets_task(self, booking_id):
    """
    Generate tickets and send via email/SMS after successful payment

    Args:
        booking_id (str): UUID of the booking
    """
    try:
        booking = Booking.objects.select_related('event').get(id=booking_id)

        # Verify booking is confirmed
        if booking.status != Booking.STATUS_CONFIRMED:
            logger.warning(f"Cannot generate tickets for booking {booking.booking_reference} with status {booking.status}")
            return

        # Check if tickets already generated
        if booking.tickets.exists():
            logger.info(f"Tickets already generated for booking {booking.booking_reference}")
            tickets = list(booking.tickets.all())
        else:
            # Generate tickets
            logger.info(f"Generating tickets for booking {booking.booking_reference}")
            tickets = TicketService.generate_tickets_for_booking(booking.id)
            logger.info(f"Generated {len(tickets)} tickets for booking {booking.booking_reference}")

        # Send email with tickets
        from apps.notifications.email_service import EmailService
        email_sent = EmailService.send_booking_confirmation(booking, tickets)

        if email_sent:
            logger.info(f"Booking confirmation email sent for {booking.booking_reference}")
        else:
            logger.error(f"Failed to send booking confirmation email for {booking.booking_reference}")

        # Send SMS notification
        from apps.notifications.sms_service import sms_service
        sms_sent = sms_service.send_booking_confirmation_sms(booking)

        if sms_sent:
            logger.info(f"Booking confirmation SMS sent for {booking.booking_reference}")
        else:
            logger.error(f"Failed to send booking confirmation SMS for {booking.booking_reference}")

    except Booking.DoesNotExist:
        logger.error(f"Booking {booking_id} not found for ticket generation")
    except Exception as e:
        logger.error(f"Error generating tickets for booking {booking_id}: {str(e)}", exc_info=True)
        # Retry task
        raise self.retry(exc=e, countdown=60)


@shared_task
def send_event_reminder_task(booking_id, hours_before=24):
    """
    Send event reminder email/SMS before event starts

    Args:
        booking_id (str): UUID of the booking
        hours_before (int): Hours before event
    """
    try:
        booking = Booking.objects.select_related('event').get(id=booking_id)

        # Only send reminders for confirmed bookings
        if booking.status != Booking.STATUS_CONFIRMED:
            logger.info(f"Skipping reminder for booking {booking.booking_reference} (status: {booking.status})")
            return

        # Send email reminder
        from apps.notifications.email_service import EmailService
        email_sent = EmailService.send_event_reminder(booking, hours_before=hours_before)

        if email_sent:
            logger.info(f"Event reminder email sent for {booking.booking_reference}")

        # Send SMS reminder
        from apps.notifications.sms_service import sms_service
        sms_sent = sms_service.send_event_reminder_sms(booking, hours_before=hours_before)

        if sms_sent:
            logger.info(f"Event reminder SMS sent for {booking.booking_reference}")

    except Booking.DoesNotExist:
        logger.error(f"Booking {booking_id} not found for event reminder")
    except Exception as e:
        logger.error(f"Error sending event reminder for booking {booking_id}: {str(e)}", exc_info=True)


@shared_task
def schedule_event_reminders_task():
    """
    Schedule event reminders for all upcoming events (24 hours before)
    Run this task daily via Celery Beat
    """
    from datetime import timedelta

    # Get all confirmed bookings for events starting in 24-25 hours
    now = timezone.now()
    reminder_start = now + timedelta(hours=24)
    reminder_end = now + timedelta(hours=25)

    bookings = Booking.objects.filter(
        status=Booking.STATUS_CONFIRMED,
        event__start_datetime__gte=reminder_start,
        event__start_datetime__lt=reminder_end
    ).select_related('event')

    logger.info(f"Found {bookings.count()} bookings for event reminders")

    for booking in bookings:
        send_event_reminder_task.delay(str(booking.id), hours_before=24)
        logger.info(f"Scheduled reminder for booking {booking.booking_reference}")


@shared_task
def cleanup_expired_bookings_task():
    """
    Cleanup old expired bookings (older than 30 days)
    Run this task weekly via Celery Beat
    """
    from datetime import timedelta

    cutoff_date = timezone.now() - timedelta(days=30)

    expired_bookings = Booking.objects.filter(
        status__in=[Booking.STATUS_EXPIRED, Booking.STATUS_CANCELLED],
        updated_at__lt=cutoff_date
    )

    count = expired_bookings.count()
    logger.info(f"Cleaning up {count} expired/cancelled bookings older than 30 days")

    # Delete old bookings
    expired_bookings.delete()

    logger.info(f"Cleaned up {count} old bookings")
