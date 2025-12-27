"""
Celery tasks for payment processing
"""

from celery import shared_task
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def process_successful_payment(self, transaction_id):
    """
    Process successful payment asynchronously

    Args:
        transaction_id (str): UUID of the transaction

    Tasks:
        1. Confirm booking (if linked to booking)
        2. Add money to wallet (if wallet top-up)
        3. Generate tickets (if booking)
        4. Send confirmation email/SMS
        5. Update ticket inventory (if booking)
    """
    from .models import Transaction
    from apps.bookings.models import Booking
    from apps.bookings.services import BookingService
    from apps.users.models import Attendee, WalletTransaction

    try:
        transaction = Transaction.objects.select_related('booking', 'attendee').get(id=transaction_id)

        logger.info(f"Processing successful payment for transaction: {transaction.transaction_reference}")

        # Check if this is a wallet top-up transaction
        if transaction.attendee and not transaction.booking:
            # This is a wallet top-up
            attendee = transaction.attendee
            amount = transaction.amount

            logger.info(f"Processing wallet top-up for attendee: {attendee.email}, Amount: {amount}")

            # Add money to wallet
            attendee.add_to_wallet(
                amount=amount,
                description=f"M-Pesa deposit - {transaction.mpesa_receipt_number or transaction.transaction_reference}",
                transaction_type=WalletTransaction.DEPOSIT
            )

            logger.info(f"Wallet top-up successful. New balance: {attendee.wallet_balance}")

            # Send wallet deposit confirmation email
            from apps.notifications.email_service import EmailService
            email_sent = EmailService.send_wallet_deposit_confirmation(
                attendee=attendee,
                amount=amount,
                new_balance=attendee.wallet_balance,
                transaction_reference=transaction.transaction_reference,
                mpesa_receipt=transaction.mpesa_receipt_number
            )

            if email_sent:
                logger.info(f"Wallet deposit confirmation email sent to {attendee.email}")
            else:
                logger.error(f"Failed to send wallet deposit confirmation email to {attendee.email}")

        # Check if transaction has linked booking
        elif transaction.booking:
            booking = transaction.booking

            logger.info(f"Transaction linked to booking: {booking.booking_reference}")

            # Update booking status to CONFIRMED
            booking.status = Booking.STATUS_CONFIRMED
            booking.payment_status = 'PAID'
            booking.payment_method = transaction.payment_method
            booking.transaction_id = str(transaction.id)
            booking.save()

            logger.info(f"Booking {booking.booking_reference} confirmed")

            # Generate tickets
            from apps.bookings.ticket_service import TicketService
            tickets = TicketService.generate_tickets_for_booking(booking.id)
            logger.info(f"Generated {len(tickets)} tickets for booking {booking.booking_reference}")

            # Send booking confirmation email with ticket PDFs
            from apps.notifications.email_service import EmailService
            email_sent = EmailService.send_booking_confirmation(booking, tickets)

            if email_sent:
                logger.info(f"Booking confirmation email sent for {booking.booking_reference}")
            else:
                logger.error(f"Failed to send booking confirmation email for {booking.booking_reference}")

        else:
            logger.warning(f"Transaction {transaction.transaction_reference} has no linked booking or attendee")

        return {
            'success': True,
            'transaction_reference': transaction.transaction_reference
        }

    except Transaction.DoesNotExist:
        logger.error(f"Transaction not found: {transaction_id}")
        return {
            'success': False,
            'error': 'Transaction not found'
        }
    except Exception as e:
        logger.error(f"Error processing payment: {str(e)}", exc_info=True)
        # Retry the task
        raise self.retry(exc=e, countdown=60)  # Retry after 60 seconds


@shared_task(bind=True, max_retries=3)
def check_pending_transactions():
    """
    Periodic task to check status of pending transactions
    Run every 5 minutes via Celery Beat

    Queries M-Pesa for transactions that are still pending
    after 15 minutes and updates their status
    """
    from .models import Transaction
    from .mpesa_service import mpesa_service
    from django.utils import timezone
    from datetime import timedelta

    try:
        # Get transactions pending for more than 15 minutes (allowing time for user to enter PIN)
        fifteen_minutes_ago = timezone.now() - timedelta(minutes=15)

        pending_transactions = Transaction.objects.filter(
            status=Transaction.PENDING,
            payment_method=Transaction.MPESA,
            checkout_request_id__isnull=False,
            created_at__lte=fifteen_minutes_ago
        )[:50]  # Limit to 50 at a time

        logger.info(f"Checking {pending_transactions.count()} pending transactions")

        for transaction in pending_transactions:
            # Query M-Pesa for status
            mpesa_response = mpesa_service.query_transaction_status(
                transaction.checkout_request_id
            )

            if mpesa_response.get('success'):
                result_code = mpesa_response.get('result_code')

                if result_code == '0':
                    # Payment successful
                    transaction.mark_as_completed(
                        result_code=result_code,
                        result_description=mpesa_response.get('result_desc')
                    )
                    logger.info(f"Transaction {transaction.transaction_reference} marked as completed")

                    # Trigger booking confirmation
                    process_successful_payment.delay(str(transaction.id))

                elif result_code and result_code != '0':
                    # Payment failed
                    transaction.mark_as_failed(
                        result_code=result_code,
                        result_description=mpesa_response.get('result_desc')
                    )
                    logger.info(f"Transaction {transaction.transaction_reference} marked as failed")

        return {
            'success': True,
            'checked': pending_transactions.count()
        }

    except Exception as e:
        logger.error(f"Error checking pending transactions: {str(e)}")
        raise self.retry(exc=e, countdown=300)  # Retry after 5 minutes


@shared_task
def cleanup_old_pending_transactions():
    """
    Clean up old pending transactions (older than 24 hours)
    Mark them as CANCELLED

    Run daily via Celery Beat
    """
    from .models import Transaction
    from django.utils import timezone
    from datetime import timedelta

    try:
        # Get transactions pending for more than 24 hours
        twenty_four_hours_ago = timezone.now() - timedelta(hours=24)

        old_transactions = Transaction.objects.filter(
            status=Transaction.PENDING,
            created_at__lte=twenty_four_hours_ago
        )

        count = old_transactions.count()

        # Mark as cancelled
        old_transactions.update(
            status=Transaction.CANCELLED,
            result_description='Transaction timeout - cancelled after 24 hours'
        )

        logger.info(f"Cancelled {count} old pending transactions")

        return {
            'success': True,
            'cancelled': count
        }

    except Exception as e:
        logger.error(f"Error cleaning up old transactions: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
