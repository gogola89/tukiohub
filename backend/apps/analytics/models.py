"""
Analytics models for event performance tracking
"""

import uuid
from django.db import models
from apps.events.models import Event
from apps.users.models import User


class EventAnalytics(models.Model):
    """
    Aggregated analytics for events
    Stores daily snapshots of event metrics
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='analytics'
    )

    # Date for this snapshot
    date = models.DateField()

    # Ticket sales metrics
    total_bookings = models.IntegerField(default=0)
    confirmed_bookings = models.IntegerField(default=0)
    cancelled_bookings = models.IntegerField(default=0)
    total_tickets_sold = models.IntegerField(default=0)
    total_tickets_checked_in = models.IntegerField(default=0)

    # Revenue metrics
    gross_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # After discounts
    discounts_given = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Payment method breakdown
    mpesa_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    card_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Ticket type breakdown (JSON)
    ticket_type_sales = models.JSONField(default=dict, blank=True)
    # Format: {"VIP": {"quantity": 10, "revenue": 15000}, ...}

    # Promo code usage
    promo_codes_used = models.JSONField(default=dict, blank=True)
    # Format: {"EARLY20": {"count": 5, "discount_total": 500}, ...}

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']
        unique_together = ['event', 'date']
        indexes = [
            models.Index(fields=['event', 'date']),
            models.Index(fields=['date']),
        ]
        verbose_name_plural = 'Event Analytics'

    def __str__(self):
        return f"{self.event.title} - {self.date}"


class OrganizerAnalytics(models.Model):
    """
    Aggregated analytics for organizers
    Stores monthly snapshots of organizer metrics
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    organizer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='analytics',
        limit_choices_to={'role': 'ORGANIZER'}
    )

    # Time period
    month = models.DateField()  # First day of the month

    # Event metrics
    total_events = models.IntegerField(default=0)
    active_events = models.IntegerField(default=0)
    completed_events = models.IntegerField(default=0)
    cancelled_events = models.IntegerField(default=0)

    # Sales metrics
    total_bookings = models.IntegerField(default=0)
    total_tickets_sold = models.IntegerField(default=0)
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Average metrics
    avg_ticket_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    avg_tickets_per_event = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-month']
        unique_together = ['organizer', 'month']
        indexes = [
            models.Index(fields=['organizer', 'month']),
        ]
        verbose_name_plural = 'Organizer Analytics'

    def __str__(self):
        return f"{self.organizer.email} - {self.month.strftime('%B %Y')}"
