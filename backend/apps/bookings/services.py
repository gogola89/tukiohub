"""
Business logic services for bookings app
"""

from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import logging

from .models import Booking, BookingItem, BookingAddOn, Ticket
from apps.events.models import Event, TicketType, PromoCode, EventAddOn

logger = logging.getLogger(__name__)


class BookingService:
    """Service class for managing bookings"""

    BOOKING_TIMEOUT_MINUTES = 5  # Booking expires after 5 minutes if not paid

    @staticmethod
    @transaction.atomic
    def create_booking(event_id, items_data, attendee_info, attendee=None, payment_method=None, promo_code=None, addons_data=None):
        """
        Create a new booking with inventory locking

        Args:
            event_id (UUID): Event ID
            items_data (list): List of {'ticket_type_id': UUID, 'quantity': int}
            attendee_info (dict): Attendee details
            attendee (Attendee): Registered attendee (optional, for guest checkout)
            payment_method (str): Payment method (MPESA, CARD, WALLET)
            promo_code (str): Promo code (optional)
            addons_data (list): List of {'addon_id': UUID, 'quantity': int} (optional)

        Returns:
            Booking: Created booking instance

        Raises:
            ValidationError: If validation fails or tickets unavailable
        """

        # Get event
        try:
            event = Event.objects.select_for_update().get(id=event_id)
        except Event.DoesNotExist:
            raise ValidationError("Event not found.")

        # Validate event is bookable
        if event.status != Event.PUBLISHED:
            raise ValidationError("Event is not published.")

        if event.is_past:
            raise ValidationError("Cannot book tickets for past events.")

        # Validate and lock inventory
        BookingService._validate_and_lock_inventory(event, items_data)

        # Validate add-ons if provided
        if addons_data:
            BookingService._validate_addons(event, addons_data)

        # Calculate amounts
        total_amount = BookingService._calculate_total(items_data, addons_data or [])
        discount_amount = Decimal('0.00')
        final_amount = total_amount

        # Apply promo code if provided
        promo_instance = None
        if promo_code:
            promo_instance = BookingService._validate_and_get_promo_code(event, promo_code)
            discount_amount = BookingService._calculate_discount(promo_instance, total_amount)
            final_amount = total_amount - discount_amount

        # If using wallet payment, check if attendee has sufficient balance
        if payment_method == 'WALLET' and attendee:
            if not attendee.can_afford(final_amount):
                raise ValidationError(f"Insufficient funds in wallet. Required: {final_amount}, Available: {attendee.wallet_balance}")

        # Create booking
        booking = Booking.objects.create(
            event=event,
            attendee=attendee,  # Add attendee reference
            attendee_name=attendee_info['attendee_name'],
            attendee_email=attendee_info['attendee_email'],
            attendee_phone=attendee_info['attendee_phone'],
            total_amount=total_amount,
            discount_amount=discount_amount,
            final_amount=final_amount,
            payment_method=payment_method,  # Add payment method
            promo_code=promo_instance,
            status=Booking.STATUS_PENDING,
            payment_status=Booking.PENDING,
            notes=attendee_info.get('notes', ''),
            expires_at=timezone.now() + timedelta(minutes=BookingService.BOOKING_TIMEOUT_MINUTES)
        )

        # Create booking items
        for item_data in items_data:
            ticket_type = TicketType.objects.get(id=item_data['ticket_type_id'])
            BookingItem.objects.create(
                booking=booking,
                ticket_type=ticket_type,
                quantity=item_data['quantity'],
                price_per_ticket=ticket_type.price
            )

            # Update ticket type quantity_sold
            ticket_type.quantity_sold += item_data['quantity']
            ticket_type.save()

        # Create add-on items if provided
        if addons_data:
            for addon_data in addons_data:
                addon = EventAddOn.objects.get(id=addon_data['addon_id'])
                BookingAddOn.objects.create(
                    booking=booking,
                    addon=addon,
                    quantity=addon_data['quantity'],
                    price_per_item=addon.price
                )

        logger.info(f"Booking created: {booking.booking_reference} for event {event.title}")

        return booking

    @staticmethod
    def _validate_and_lock_inventory(event, items_data):
        """
        Validate ticket availability and lock inventory

        Args:
            event (Event): Event instance
            items_data (list): List of ticket type IDs and quantities

        Raises:
            ValidationError: If tickets unavailable or invalid
        """
        for item_data in items_data:
            try:
                # Use select_for_update to lock the row
                ticket_type = TicketType.objects.select_for_update().get(
                    id=item_data['ticket_type_id'],
                    event=event
                )
            except TicketType.DoesNotExist:
                raise ValidationError(f"Ticket type not found for this event.")

            # Check if ticket type is active
            if not ticket_type.is_active:
                raise ValidationError(f"Ticket type '{ticket_type.name}' is not active.")

            # Check if sales period is valid
            now = timezone.now()
            if not (ticket_type.sales_start_date <= now <= ticket_type.sales_end_date):
                raise ValidationError(
                    f"Ticket type '{ticket_type.name}' is not on sale. "
                    f"Sales period: {ticket_type.sales_start_date} to {ticket_type.sales_end_date}"
                )

            # Check availability
            if ticket_type.available_quantity < item_data['quantity']:
                raise ValidationError(
                    f"Only {ticket_type.available_quantity} tickets available for '{ticket_type.name}'. "
                    f"Requested: {item_data['quantity']}"
                )

    @staticmethod
    def _validate_addons(event, addons_data):
        """Validate add-ons are available"""
        for addon_data in addons_data:
            try:
                addon = EventAddOn.objects.get(id=addon_data['addon_id'], event=event)
            except EventAddOn.DoesNotExist:
                raise ValidationError("Add-on not found for this event.")

            if not addon.is_active:
                raise ValidationError(f"Add-on '{addon.name}' is not active.")

            # Check quantity if not unlimited
            if addon.quantity_available is not None:
                if addon.quantity_available < addon_data['quantity']:
                    raise ValidationError(
                        f"Only {addon.quantity_available} available for add-on '{addon.name}'. "
                        f"Requested: {addon_data['quantity']}"
                    )

    @staticmethod
    def _calculate_total(items_data, addons_data):
        """Calculate total amount"""
        total = Decimal('0.00')

        # Add ticket prices
        for item_data in items_data:
            ticket_type = TicketType.objects.get(id=item_data['ticket_type_id'])
            total += ticket_type.price * item_data['quantity']

        # Add addon prices
        for addon_data in addons_data:
            addon = EventAddOn.objects.get(id=addon_data['addon_id'])
            total += addon.price * addon_data['quantity']

        return total

    @staticmethod
    def _validate_and_get_promo_code(event, code):
        """Validate and return promo code instance"""
        try:
            promo = PromoCode.objects.get(code=code.upper(), event=event)
        except PromoCode.DoesNotExist:
            raise ValidationError("Invalid promo code for this event.")

        if not promo.is_active:
            raise ValidationError("Promo code is not active.")

        if not promo.is_valid():
            raise ValidationError("Promo code has expired.")

        if not promo.can_be_used():
            raise ValidationError("Promo code usage limit exceeded.")

        return promo

    @staticmethod
    def _calculate_discount(promo_code, total_amount):
        """Calculate discount amount"""
        if promo_code.discount_type == PromoCode.PERCENTAGE:
            discount = total_amount * (promo_code.discount_value / 100)
        else:  # FIXED
            discount = promo_code.discount_value

        # Ensure discount doesn't exceed total
        return min(discount, total_amount)

    @staticmethod
    @transaction.atomic
    def confirm_booking(booking_id, payment_method=None):
        """
        Confirm booking after successful payment

        Args:
            booking_id (UUID): Booking ID
            payment_method (str): Payment method used

        Returns:
            Booking: Confirmed booking
        """
        try:
            booking = Booking.objects.select_for_update().get(id=booking_id)
        except Booking.DoesNotExist:
            raise ValidationError("Booking not found.")

        if booking.status == Booking.STATUS_CONFIRMED:
            logger.warning(f"Booking {booking.booking_reference} already confirmed")
            return booking

        if booking.status != Booking.STATUS_PENDING:
            raise ValidationError(f"Cannot confirm booking with status: {booking.status}")

        # Handle wallet payment - deduct from attendee's wallet
        if payment_method == 'WALLET' and booking.attendee:
            booking.attendee.withdraw_from_wallet(booking.final_amount)

            # Create wallet transaction record
            from apps.users.models import WalletTransaction
            WalletTransaction.objects.create(
                attendee=booking.attendee,
                transaction_type=WalletTransaction.BOOKING,
                amount=booking.final_amount,
                description=f"Payment for booking {booking.booking_reference}",
                booking=booking
            )

        # Update booking status
        booking.confirm()
        if payment_method:
            booking.payment_method = payment_method
            booking.save()

        # Increment promo code usage if used
        if booking.promo_code:
            booking.promo_code.times_used += 1
            booking.promo_code.save()

        logger.info(f"Booking confirmed: {booking.booking_reference}")

        return booking

    @staticmethod
    @transaction.atomic
    def release_inventory(booking_id):
        """
        Release inventory when booking expires or is cancelled

        Args:
            booking_id (UUID): Booking ID
        """
        try:
            booking = Booking.objects.select_for_update().get(id=booking_id)
        except Booking.DoesNotExist:
            logger.error(f"Booking {booking_id} not found for inventory release")
            return

        if booking.status not in [Booking.STATUS_PENDING, Booking.STATUS_EXPIRED]:
            logger.warning(f"Cannot release inventory for booking {booking.booking_reference} with status {booking.status}")
            return

        # Release inventory for each booking item
        for item in booking.items.all():
            ticket_type = item.ticket_type
            ticket_type.quantity_sold -= item.quantity
            ticket_type.save()

        logger.info(f"Inventory released for booking: {booking.booking_reference}")

    @staticmethod
    @transaction.atomic
    def cancel_booking(booking_id, reason=None):
        """
        Cancel a booking and release inventory

        Args:
            booking_id (UUID): Booking ID
            reason (str): Cancellation reason

        Returns:
            Booking: Cancelled booking
        """
        try:
            booking = Booking.objects.select_for_update().get(id=booking_id)
        except Booking.DoesNotExist:
            raise ValidationError("Booking not found.")

        if booking.status == Booking.STATUS_CANCELLED:
            return booking

        # Can only cancel pending or confirmed bookings
        if booking.status not in [Booking.STATUS_PENDING, Booking.STATUS_CONFIRMED]:
            raise ValidationError(f"Cannot cancel booking with status: {booking.status}")

        # Handle refund for wallet payments
        if booking.payment_method == 'WALLET' and booking.attendee and booking.status == Booking.STATUS_CONFIRMED:
            # Refund the amount to attendee's wallet
            booking.attendee.add_to_wallet(booking.final_amount)

            # Create wallet transaction record for refund
            from apps.users.models import WalletTransaction
            WalletTransaction.objects.create(
                attendee=booking.attendee,
                transaction_type=WalletTransaction.REFUND,
                amount=booking.final_amount,
                description=f"Refund for cancelled booking {booking.booking_reference}",
                booking=booking
            )

        # Release inventory if pending
        if booking.status == Booking.STATUS_PENDING:
            BookingService.release_inventory(booking.id)

        # Cancel booking
        booking.cancel()

        if reason:
            booking.notes = f"{booking.notes}\n\nCancellation reason: {reason}" if booking.notes else f"Cancellation reason: {reason}"
            booking.save()

        # Cancel all tickets
        for ticket in booking.tickets.all():
            ticket.cancel()

        logger.info(f"Booking cancelled: {booking.booking_reference}")

        return booking

    @staticmethod
    @transaction.atomic
    def expire_booking(booking_id):
        """
        Expire a booking (timeout) and release inventory

        Args:
            booking_id (UUID): Booking ID

        Returns:
            Booking: Expired booking
        """
        try:
            booking = Booking.objects.select_for_update().get(id=booking_id)
        except Booking.DoesNotExist:
            logger.error(f"Booking {booking_id} not found for expiration")
            return None

        if booking.status != Booking.STATUS_PENDING:
            logger.warning(f"Cannot expire booking {booking.booking_reference} with status {booking.status}")
            return booking

        # Release inventory
        BookingService.release_inventory(booking.id)

        # Expire booking
        booking.expire()

        logger.info(f"Booking expired: {booking.booking_reference}")

        return booking
