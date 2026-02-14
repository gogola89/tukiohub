"""
SMS notification service using Africa's Talking
"""

import africastalking
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def _get_ticket_download_url(ticket_code):
    """Build the full download URL for a ticket."""
    from decouple import config
    allowed_hosts = config('ALLOWED_HOSTS', default='localhost')
    hosts = [h.strip() for h in allowed_hosts.split(',') if h.strip()]
    public_host = None
    for h in hosts:
        if h not in ('localhost', '127.0.0.1', 'backend'):
            public_host = h
            break
    if public_host:
        base_url = f'https://{public_host}'
    else:
        base_url = 'http://localhost:8000'
    return f'{base_url}/api/bookings/tickets/{ticket_code}/download/'


class SMSService:
    """Service for sending SMS via Africa's Talking"""

    def __init__(self):
        """Initialize Africa's Talking"""
        try:
            africastalking.initialize(
                username=settings.AFRICASTALKING_USERNAME,
                api_key=settings.AFRICASTALKING_API_KEY
            )
            self.sms = africastalking.SMS
        except Exception as e:
            logger.error(f"Failed to initialize Africa's Talking: {str(e)}")
            self.sms = None

    def send_sms(self, phone_number, message):
        """
        Send SMS to a phone number

        Args:
            phone_number (str): Phone number in international format
            message (str): SMS message (max 160 chars recommended)

        Returns:
            bool: True if SMS sent successfully
        """
        if not self.sms:
            logger.error("Africa's Talking not initialized")
            return False

        try:
            response = self.sms.send(message, [phone_number])
            logger.info(f"SMS sent to {phone_number}: {response}")
            return True
        except Exception as e:
            logger.error(f"Failed to send SMS to {phone_number}: {str(e)}")
            return False

    def send_booking_confirmation_sms(self, booking):
        """
        Send booking confirmation SMS

        Args:
            booking: Booking instance

        Returns:
            bool: True if SMS sent successfully
        """
        event = booking.event
        # Include download link for the first ticket if available
        first_ticket = booking.tickets.first()
        download_part = ''
        if first_ticket:
            download_url = _get_ticket_download_url(first_ticket.ticket_code)
            download_part = f' Download: {download_url}'

        message = (
            f"Booking confirmed! Ref: {booking.booking_reference}. "
            f"Event: {event.title} on {event.start_datetime.strftime('%d %b %Y')}.{download_part} "
            f"TukioHub"
        )

        return self.send_sms(booking.attendee_phone, message)

    def send_ticket_sms(self, ticket):
        """
        Send ticket SMS with download link

        Args:
            ticket: Ticket instance

        Returns:
            bool: True if SMS sent successfully
        """
        download_url = _get_ticket_download_url(ticket.ticket_code)
        message = (
            f"Your ticket for {ticket.booking.event.title}. "
            f"Code: {ticket.ticket_code}. "
            f"Download: {download_url} TukioHub"
        )

        return self.send_sms(ticket.attendee_phone, message)

    def send_event_reminder_sms(self, booking, hours_before=24):
        """
        Send event reminder SMS

        Args:
            booking: Booking instance
            hours_before: Hours before event

        Returns:
            bool: True if SMS sent successfully
        """
        event = booking.event
        message = (
            f"Reminder: {event.title} in {hours_before}hrs! "
            f"Venue: {event.venue_name}. "
            f"Time: {event.start_datetime.strftime('%I:%M %p')}. "
            f"Ref: {booking.booking_reference}. TukioHub"
        )

        if len(message) > 160:
            message = message[:157] + "..."

        return self.send_sms(booking.attendee_phone, message)

    def send_refund_confirmation_sms(self, booking, refund_amount):
        """
        Send refund confirmation SMS

        Args:
            booking: Booking instance
            refund_amount: Refund amount

        Returns:
            bool: True if SMS sent successfully
        """
        message = (
            f"Refund of KES {refund_amount} processed for booking {booking.booking_reference}. "
            f"Expect funds in 3-5 business days. TukioHub"
        )

        if len(message) > 160:
            message = message[:157] + "..."

        return self.send_sms(booking.attendee_phone, message)


# Create singleton instance
sms_service = SMSService()
