"""
Models for payments app
"""

import uuid
from django.db import models
from django.core.validators import MinValueValidator
from apps.events.models import Event


class Transaction(models.Model):
    """
    Transaction model for tracking all payments (M-Pesa and Card)
    """

    # Payment method choices
    MPESA = 'MPESA'
    CARD = 'CARD'
    CASH = 'CASH'

    PAYMENT_METHOD_CHOICES = [
        (MPESA, 'M-Pesa'),
        (CARD, 'Card Payment'),
        (CASH, 'Cash'),
    ]

    # Transaction status choices
    PENDING = 'PENDING'
    COMPLETED = 'COMPLETED'
    FAILED = 'FAILED'
    CANCELLED = 'CANCELLED'

    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (COMPLETED, 'Completed'),
        (FAILED, 'Failed'),
        (CANCELLED, 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Booking reference (linked after booking creation)
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions'
    )

    # Event reference for tracking (optional - null for wallet top-ups)
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='transactions',
        null=True,
        blank=True
    )

    # Attendee reference for wallet top-ups
    attendee = models.ForeignKey(
        'users.Attendee',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payment_transactions'
    )

    # Payment details
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    phone_number = models.CharField(max_length=15, blank=True, null=True)  # Optional - only for M-Pesa
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        default=MPESA
    )

    # M-Pesa specific fields
    mpesa_receipt_number = models.CharField(max_length=100, blank=True, null=True)
    checkout_request_id = models.CharField(max_length=100, blank=True, null=True)
    merchant_request_id = models.CharField(max_length=100, blank=True, null=True)

    # Card payment specific fields
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True, null=True)

    # Transaction reference (unique identifier for this transaction)
    transaction_reference = models.CharField(max_length=100, unique=True)

    # Status tracking
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=PENDING
    )

    # Result details
    result_code = models.CharField(max_length=10, blank=True, null=True)
    result_description = models.TextField(blank=True, null=True)

    # Metadata
    metadata = models.JSONField(default=dict, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['transaction_reference']),
            models.Index(fields=['checkout_request_id']),
            models.Index(fields=['phone_number', 'created_at']),
            models.Index(fields=['status', 'created_at']),
        ]

    def __str__(self):
        return f"{self.transaction_reference} - {self.payment_method} - {self.status}"

    @property
    def is_successful(self):
        """Check if transaction is successful"""
        return self.status == self.COMPLETED

    @property
    def is_pending(self):
        """Check if transaction is pending"""
        return self.status == self.PENDING

    @property
    def is_failed(self):
        """Check if transaction is failed"""
        return self.status == self.FAILED

    def mark_as_completed(self, receipt_number=None, result_code=None, result_description=None):
        """Mark transaction as completed"""
        from django.utils import timezone

        self.status = self.COMPLETED
        self.completed_at = timezone.now()

        if receipt_number:
            self.mpesa_receipt_number = receipt_number
        if result_code:
            self.result_code = result_code
        if result_description:
            self.result_description = result_description

        self.save()

    def mark_as_failed(self, result_code=None, result_description=None):
        """Mark transaction as failed"""
        self.status = self.FAILED

        if result_code:
            self.result_code = result_code
        if result_description:
            self.result_description = result_description

        self.save()

    def mark_as_cancelled(self):
        """Mark transaction as cancelled"""
        self.status = self.CANCELLED
        self.save()
