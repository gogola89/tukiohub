"""
Email notification service using SendGrid
"""

from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags
import logging

logger = logging.getLogger(__name__)


def _get_ticket_download_url(ticket_code):
    """Build the full download URL for a ticket."""
    # Use ALLOWED_HOSTS or a dedicated setting for the backend base URL
    from decouple import config
    allowed_hosts = config('ALLOWED_HOSTS', default='localhost')
    # Pick the first non-localhost host if available, otherwise fallback
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


class EmailService:
    """Service for sending emails via SendGrid"""

    @staticmethod
    def send_booking_confirmation(booking, tickets):
        """
        Send booking confirmation email with tickets

        Args:
            booking: Booking instance
            tickets: List of Ticket instances

        Returns:
            bool: True if email sent successfully
        """
        try:
            # Prepare context for email template
            tickets_with_urls = []
            for ticket in tickets:
                tickets_with_urls.append({
                    'ticket': ticket,
                    'download_url': _get_ticket_download_url(ticket.ticket_code),
                })
            context = {
                'booking': booking,
                'tickets': tickets,
                'tickets_with_urls': tickets_with_urls,
                'event': booking.event,
                'total_tickets': len(tickets),
            }

            # Render HTML email
            html_message = render_to_string('emails/booking_confirmation.html', context)
            plain_message = strip_tags(html_message)

            # Create email
            email = EmailMessage(
                subject=f'Booking Confirmation - {booking.event.title}',
                body=html_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[booking.attendee_email],
            )
            email.content_subtype = 'html'

            # Attach ticket PDFs
            from apps.bookings.ticket_service import TicketService

            for ticket in tickets:
                pdf_buffer = TicketService.generate_ticket_pdf(ticket)
                if pdf_buffer:
                    email.attach(
                        f'ticket_{ticket.ticket_code}.pdf',
                        pdf_buffer.getvalue(),
                        'application/pdf'
                    )

            # Send email
            email.send(fail_silently=False)

            logger.info(f"Booking confirmation email sent to {booking.attendee_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send booking confirmation email: {str(e)}")
            return False

    @staticmethod
    def send_event_reminder(booking, hours_before=24):
        """
        Send event reminder email

        Args:
            booking: Booking instance
            hours_before: Hours before event

        Returns:
            bool: True if email sent successfully
        """
        try:
            # Build ticket download URLs
            tickets_with_urls = []
            for ticket in booking.tickets.all():
                tickets_with_urls.append({
                    'ticket': ticket,
                    'download_url': _get_ticket_download_url(ticket.ticket_code),
                })
            context = {
                'booking': booking,
                'event': booking.event,
                'hours_before': hours_before,
                'tickets_with_urls': tickets_with_urls,
            }

            html_message = render_to_string('emails/event_reminder.html', context)
            plain_message = strip_tags(html_message)

            email = EmailMessage(
                subject=f'Reminder: {booking.event.title} in {hours_before} hours',
                body=html_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[booking.attendee_email],
            )
            email.content_subtype = 'html'
            email.send(fail_silently=False)

            logger.info(f"Event reminder sent to {booking.attendee_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send event reminder: {str(e)}")
            return False

    @staticmethod
    def send_refund_confirmation(booking, refund_amount):
        """
        Send refund confirmation email

        Args:
            booking: Booking instance
            refund_amount: Refund amount

        Returns:
            bool: True if email sent successfully
        """
        try:
            context = {
                'booking': booking,
                'refund_amount': refund_amount,
            }

            html_message = render_to_string('emails/refund_confirmation.html', context)

            email = EmailMessage(
                subject=f'Refund Confirmation - {booking.booking_reference}',
                body=html_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[booking.attendee_email],
            )
            email.content_subtype = 'html'
            email.send(fail_silently=False)

            logger.info(f"Refund confirmation sent to {booking.attendee_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send refund confirmation: {str(e)}")
            return False

    @staticmethod
    def send_ticket_transfer(ticket, old_email, new_email):
        """
        Send ticket transfer notification

        Args:
            ticket: Ticket instance
            old_email: Previous owner's email
            new_email: New owner's email

        Returns:
            bool: True if emails sent successfully
        """
        try:
            # Email to new owner
            context = {
                'ticket': ticket,
                'event': ticket.booking.event,
                'is_new_owner': True,
                'download_url': _get_ticket_download_url(ticket.ticket_code),
            }

            html_message = render_to_string('emails/ticket_transfer.html', context)

            email = EmailMessage(
                subject=f'Ticket Transferred - {ticket.booking.event.title}',
                body=html_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[new_email],
            )
            email.content_subtype = 'html'

            # Attach ticket PDF
            from apps.bookings.ticket_service import TicketService
            pdf_buffer = TicketService.generate_ticket_pdf(ticket)
            if pdf_buffer:
                email.attach(
                    f'ticket_{ticket.ticket_code}.pdf',
                    pdf_buffer.getvalue(),
                    'application/pdf'
                )

            email.send(fail_silently=False)

            # Email to old owner
            context['is_new_owner'] = False
            html_message = render_to_string('emails/ticket_transfer.html', context)

            email = EmailMessage(
                subject=f'Ticket Transfer Confirmation - {ticket.booking.event.title}',
                body=html_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[old_email],
            )
            email.content_subtype = 'html'
            email.send(fail_silently=False)

            logger.info(f"Ticket transfer emails sent for {ticket.ticket_code}")
            return True

        except Exception as e:
            logger.error(f"Failed to send ticket transfer emails: {str(e)}")
            return False

    @staticmethod
    def send_password_reset_email(user_obj, password_reset, user_type='organizer'):
        """
        Send password reset email to user or attendee

        Args:
            user_obj: User or Attendee instance
            password_reset: PasswordReset instance
            user_type: 'organizer' or 'attendee'

        Returns:
            bool: True if email sent successfully
        """
        try:
            # Build reset URL (frontend will handle the token)
            reset_url = f"{settings.FRONTEND_URL}/reset-password?token={password_reset.token}"

            context = {
                'user': user_obj,
                'reset_url': reset_url,
                'user_type': user_type,
                'first_name': user_obj.first_name if hasattr(user_obj, 'first_name') else user_obj.email.split('@')[0],
            }

            # Render HTML and plain text email
            html_message = render_to_string('emails/password_reset_email.html', context)
            plain_message = render_to_string('emails/password_reset_email.txt', context)

            email = EmailMessage(
                subject='Password Reset Request - TukioHub',
                body=html_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user_obj.email],
            )
            email.content_subtype = 'html'
            email.send(fail_silently=False)

            logger.info(f"Password reset email sent to {user_obj.email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send password reset email: {str(e)}")
            return False

    @staticmethod
    def send_daily_report(event, report_data, admin_email):
        """
        Send daily registration/payment and reconciliation report

        Args:
            event: Event instance
            report_data: Dict from AnalyticsService.get_reconciliation_report
            admin_email: Recipient email address

        Returns:
            bool: True if email sent successfully
        """
        try:
            context = {'report': report_data}

            html_message = render_to_string('emails/daily_report.html', context)
            plain_message = strip_tags(html_message)

            status_label = 'Clean' if report_data.get('reconciliation', {}).get('is_clean') else 'Needs Review'

            email = EmailMessage(
                subject=f'Daily Report - {event.title} [{status_label}]',
                body=html_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[admin_email],
            )
            email.content_subtype = 'html'
            email.send(fail_silently=False)

            logger.info(f"Daily report sent to {admin_email} for event {event.title}")
            return True

        except Exception as e:
            logger.error(f"Failed to send daily report: {str(e)}")
            return False

    @staticmethod
    def send_wallet_deposit_confirmation(attendee, amount, new_balance, transaction_reference=None, mpesa_receipt=None):
        """
        Send wallet deposit confirmation email

        Args:
            attendee: Attendee instance
            amount: Deposit amount
            new_balance: New wallet balance after deposit
            transaction_reference: Transaction reference (optional)
            mpesa_receipt: M-Pesa receipt number (optional)

        Returns:
            bool: True if email sent successfully
        """
        try:
            from django.utils import timezone

            context = {
                'attendee': attendee,
                'amount': amount,
                'new_balance': new_balance,
                'transaction_reference': transaction_reference,
                'mpesa_receipt': mpesa_receipt,
                'date_time': timezone.now().strftime('%B %d, %Y at %I:%M %p'),
            }

            html_message = render_to_string('emails/wallet_deposit_confirmation.html', context)
            plain_message = render_to_string('emails/wallet_deposit_confirmation.txt', context)

            email = EmailMessage(
                subject='Wallet Deposit Successful - TukioHub',
                body=html_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[attendee.email],
            )
            email.content_subtype = 'html'
            email.send(fail_silently=False)

            logger.info(f"Wallet deposit confirmation email sent to {attendee.email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send wallet deposit confirmation email: {str(e)}")
            return False
