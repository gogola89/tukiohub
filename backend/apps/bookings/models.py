"""
Models for bookings app
"""

import uuid
import secrets
from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from apps.events.models import Event, TicketType, PromoCode, EventAddOn
from apps.users.models import Attendee


class Booking(models.Model):
    """
    Booking model for managing event ticket bookings
    Supports both guest checkout and registered users
    """

    # Payment status choices
    PENDING = 'PENDING'
    PAID = 'PAID'
    REFUNDED = 'REFUNDED'
    CANCELLED = 'CANCELLED'

    PAYMENT_STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (PAID, 'Paid'),
        (REFUNDED, 'Refunded'),
        (CANCELLED, 'Cancelled'),
    ]

    # Booking status choices
    STATUS_PENDING = 'PENDING'
    STATUS_CONFIRMED = 'CONFIRMED'
    STATUS_CANCELLED = 'CANCELLED'
    STATUS_EXPIRED = 'EXPIRED'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_CONFIRMED, 'Confirmed'),
        (STATUS_CANCELLED, 'Cancelled'),
        (STATUS_EXPIRED, 'Expired'),
    ]

    # Payment method choices
    MPESA = 'MPESA'
    CARD = 'CARD'
    WALLET = 'WALLET'
    CASH = 'CASH'

    PAYMENT_METHOD_CHOICES = [
        (MPESA, 'M-Pesa'),
        (CARD, 'Card Payment'),
        (WALLET, 'Wallet'),
        (CASH, 'Cash'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking_reference = models.CharField(max_length=20, unique=True, db_index=True)

    # Event reference
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='bookings'
    )

    # Reference to registered user (optional for guest checkout)
    attendee = models.ForeignKey(
        Attendee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='bookings'
    )

    # Attendee information (for guest checkout compatibility)
    attendee_name = models.CharField(max_length=255)
    attendee_email = models.EmailField()
    attendee_phone = models.CharField(max_length=15)

    # Pricing
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    discount_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )
    final_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    # Payment tracking
    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default=PENDING
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        null=True,
        blank=True
    )

    # Promo code
    promo_code = models.ForeignKey(
        PromoCode,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='bookings'
    )

    # Booking status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING
    )

    # Additional notes
    notes = models.TextField(blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['booking_reference']),
            models.Index(fields=['attendee_email', 'created_at']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['event', 'status']),
            models.Index(fields=['attendee', 'created_at']),
        ]

    def __str__(self):
        return f"{self.booking_reference} - {self.attendee_name}"

    def save(self, *args, **kwargs):
        """Override save to generate booking reference"""
        if not self.booking_reference:
            self.booking_reference = self.generate_booking_reference()
        super().save(*args, **kwargs)

    @staticmethod
    def generate_booking_reference():
        """Generate unique booking reference"""
        # Format: BK-XXXXXX (6 uppercase alphanumeric characters)
        while True:
            reference = f"BK-{secrets.token_hex(3).upper()}"
            if not Booking.objects.filter(booking_reference=reference).exists():
                return reference

    def clean(self):
        """Validate booking fields"""
        # Validate final amount
        if self.final_amount < 0:
            raise ValidationError('Final amount cannot be negative.')

        # Validate discount
        if self.discount_amount > self.total_amount:
            raise ValidationError('Discount amount cannot exceed total amount.')

    @property
    def is_confirmed(self):
        """Check if booking is confirmed"""
        return self.status == self.STATUS_CONFIRMED

    @property
    def is_pending(self):
        """Check if booking is pending"""
        return self.status == self.STATUS_PENDING

    @property
    def is_expired(self):
        """Check if booking has expired"""
        return self.status == self.STATUS_EXPIRED

    @property
    def total_tickets(self):
        """Get total number of tickets in booking"""
        return sum(item.quantity for item in self.items.all())

    def confirm(self):
        """Confirm booking after successful payment"""
        self.status = self.STATUS_CONFIRMED
        self.payment_status = self.PAID
        self.confirmed_at = timezone.now()
        self.save()

    def cancel(self):
        """Cancel booking"""
        self.status = self.STATUS_CANCELLED
        self.save()

    def expire(self):
        """Expire booking (timeout)"""
        self.status = self.STATUS_EXPIRED
        self.save()


class BookingItem(models.Model):
    """
    Booking item representing ticket type and quantity in a booking
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='items'
    )

    ticket_type = models.ForeignKey(
        TicketType,
        on_delete=models.CASCADE,
        related_name='booking_items'
    )

    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    price_per_ticket = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    # Calculated field
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        unique_together = ['booking', 'ticket_type']

    def __str__(self):
        return f"{self.booking.booking_reference} - {self.ticket_type.name} x{self.quantity}"

    def save(self, *args, **kwargs):
        """Calculate subtotal before saving"""
        self.subtotal = self.price_per_ticket * self.quantity
        super().save(*args, **kwargs)

    def clean(self):
        """Validate booking item"""
        if self.quantity <= 0:
            raise ValidationError('Quantity must be greater than zero.')


class BookingAddOn(models.Model):
    """
    Add-ons purchased with a booking
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='addon_items'
    )

    addon = models.ForeignKey(
        EventAddOn,
        on_delete=models.CASCADE,
        related_name='booking_addons'
    )

    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    price_per_item = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        unique_together = ['booking', 'addon']

    def __str__(self):
        return f"{self.booking.booking_reference} - {self.addon.name} x{self.quantity}"

    def save(self, *args, **kwargs):
        """Calculate subtotal before saving"""
        self.subtotal = self.price_per_item * self.quantity
        super().save(*args, **kwargs)


class Ticket(models.Model):
    """
    Individual ticket generated from booking
    Each ticket has a unique QR code for verification
    """

    # Ticket status choices
    ACTIVE = 'ACTIVE'
    USED = 'USED'
    CANCELLED = 'CANCELLED'
    TRANSFERRED = 'TRANSFERRED'

    STATUS_CHOICES = [
        (ACTIVE, 'Active'),
        (USED, 'Used'),
        (CANCELLED, 'Cancelled'),
        (TRANSFERRED, 'Transferred'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='tickets'
    )

    ticket_type = models.ForeignKey(
        TicketType,
        on_delete=models.CASCADE,
        related_name='tickets'
    )

    # Ticket code for QR code
    ticket_code = models.CharField(max_length=50, unique=True, db_index=True)

    # Attendee information (can be different from booking if transferred)
    attendee_name = models.CharField(max_length=255)
    attendee_email = models.EmailField(blank=True)

    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=ACTIVE
    )

    # QR code image (stored after generation)
    qr_code_image = models.ImageField(
        upload_to='tickets/qr_codes/',
        blank=True,
        null=True
    )

    # Check-in tracking
    checked_in_at = models.DateTimeField(null=True, blank=True)
    checked_in_by = models.CharField(max_length=255, blank=True)  # Staff/organizer name

    # Transfer tracking
    transferred_from = models.EmailField(blank=True)
    transferred_at = models.DateTimeField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['ticket_code']),
            models.Index(fields=['booking', 'status']),
            models.Index(fields=['status', 'created_at']),
        ]

    def __str__(self):
        return f"{self.ticket_code} - {self.attendee_name}"

    def save(self, *args, **kwargs):
        """Override save to generate ticket code"""
        if not self.ticket_code:
            self.ticket_code = self.generate_ticket_code()
        super().save(*args, **kwargs)

    @staticmethod
    def generate_ticket_code():
        """Generate unique ticket code for QR code"""
        # Format: TK-XXXXXXXXXXXX (12 uppercase alphanumeric characters)
        while True:
            code = f"TK-{secrets.token_hex(6).upper()}"
            if not Ticket.objects.filter(ticket_code=code).exists():
                return code

    @property
    def is_active(self):
        """Check if ticket is active"""
        return self.status == self.ACTIVE

    @property
    def is_used(self):
        """Check if ticket has been used"""
        return self.status == self.USED

    @property
    def is_checked_in(self):
        """Check if ticket has been checked in"""
        return self.checked_in_at is not None

    @property
    def event(self):
        """Get event from booking"""
        return self.booking.event

    def check_in(self, checked_in_by=None):
        """Mark ticket as checked in"""
        if self.is_checked_in:
            raise ValidationError('Ticket has already been checked in.')

        if self.status != self.ACTIVE:
            raise ValidationError(f'Cannot check in ticket with status: {self.status}')

        self.status = self.USED
        self.checked_in_at = timezone.now()
        self.checked_in_by = checked_in_by or 'Unknown'
        self.save()

    def transfer(self, new_attendee_name, new_attendee_email):
        """Transfer ticket to another person"""
        if self.status != self.ACTIVE:
            raise ValidationError(f'Cannot transfer ticket with status: {self.status}')

        if self.is_checked_in:
            raise ValidationError('Cannot transfer checked-in ticket.')

        self.transferred_from = self.attendee_email
        self.attendee_name = new_attendee_name
        self.attendee_email = new_attendee_email
        self.status = self.TRANSFERRED
        self.transferred_at = timezone.now()
        self.save()

    def cancel(self):
        """Cancel ticket"""
        if self.is_checked_in:
            raise ValidationError('Cannot cancel checked-in ticket.')

        self.status = self.CANCELLED
        self.save()
