"""
Models for events app
"""

import uuid
from django.db import models
from django.utils.text import slugify
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from apps.users.models import User


class Event(models.Model):
    """Event model for managing events"""

    # Status choices
    DRAFT = 'DRAFT'
    PUBLISHED = 'PUBLISHED'
    CANCELLED = 'CANCELLED'
    COMPLETED = 'COMPLETED'

    STATUS_CHOICES = [
        (DRAFT, 'Draft'),
        (PUBLISHED, 'Published'),
        (CANCELLED, 'Cancelled'),
        (COMPLETED, 'Completed'),
    ]

    # Category choices
    MUSIC = 'MUSIC'
    SPORTS = 'SPORTS'
    BUSINESS = 'BUSINESS'
    ENTERTAINMENT = 'ENTERTAINMENT'
    CONFERENCE = 'CONFERENCE'
    WORKSHOP = 'WORKSHOP'
    FESTIVAL = 'FESTIVAL'
    CHARITY = 'CHARITY'
    NETWORKING = 'NETWORKING'
    OTHER = 'OTHER'

    CATEGORY_CHOICES = [
        (MUSIC, 'Music'),
        (SPORTS, 'Sports'),
        (BUSINESS, 'Business'),
        (ENTERTAINMENT, 'Entertainment'),
        (CONFERENCE, 'Conference'),
        (WORKSHOP, 'Workshop'),
        (FESTIVAL, 'Festival'),
        (CHARITY, 'Charity'),
        (NETWORKING, 'Networking'),
        (OTHER, 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organizer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='events'
    )
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, max_length=300, blank=True)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)

    # Venue information
    venue_name = models.CharField(max_length=255)
    venue_address = models.TextField()
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True
    )

    # Event timing
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()

    # Event details
    capacity = models.IntegerField(validators=[MinValueValidator(1)])
    is_free = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=DRAFT)

    # Media
    featured_image = models.ImageField(upload_to='events/', null=True, blank=True)
    images = models.JSONField(default=list, blank=True)

    # Additional information
    age_restriction = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    tags = models.JSONField(default=list, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_datetime']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['category', 'start_datetime']),
            models.Index(fields=['status', 'start_datetime']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        """Override save to auto-generate slug"""
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            while Event.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def clean(self):
        """Validate model fields"""
        if self.end_datetime and self.start_datetime:
            if self.end_datetime <= self.start_datetime:
                raise ValidationError('End datetime must be after start datetime.')

        if self.status == self.PUBLISHED:
            if not self.featured_image:
                raise ValidationError('Featured image is required for published events.')
            if not self.ticket_types.exists():
                raise ValidationError('At least one ticket type is required for published events.')

    @property
    def is_upcoming(self):
        """Check if event is upcoming"""
        if self.start_datetime is None:
            return False
        return self.start_datetime > timezone.now()

    @property
    def is_past(self):
        """Check if event has ended"""
        if self.end_datetime is None:
            return False
        return self.end_datetime < timezone.now()

    @property
    def is_sold_out(self):
        """Check if event is sold out"""
        total_capacity = sum(
            ticket_type.quantity_available or 0
            for ticket_type in self.ticket_types.all()
        )
        total_sold = sum(
            ticket_type.quantity_sold or 0
            for ticket_type in self.ticket_types.all()
        )
        return total_sold >= total_capacity if total_capacity > 0 else False

    @property
    def available_tickets(self):
        """Get total available tickets across all ticket types"""
        return sum(
            ticket_type.available_quantity
            for ticket_type in self.ticket_types.filter(is_active=True)
        )

    @property
    def min_price(self):
        """Get minimum ticket price"""
        if self.is_free:
            return 0
        prices = [tt.price for tt in self.ticket_types.filter(is_active=True)]
        return min(prices) if prices else 0

    @property
    def max_price(self):
        """Get maximum ticket price"""
        if self.is_free:
            return 0
        prices = [tt.price for tt in self.ticket_types.filter(is_active=True)]
        return max(prices) if prices else 0


class TicketType(models.Model):
    """Ticket type model for event ticketing"""

    # Ticket type name choices
    VVIP = 'VVIP'
    VIP = 'VIP'
    REGULAR = 'REGULAR'
    EARLY_BIRD = 'EARLY_BIRD'
    STUDENT = 'STUDENT'
    GROUP = 'GROUP'

    NAME_CHOICES = [
        (VVIP, 'VVIP'),
        (VIP, 'VIP'),
        (REGULAR, 'Regular'),
        (EARLY_BIRD, 'Early Bird'),
        (STUDENT, 'Student'),
        (GROUP, 'Group'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='ticket_types'
    )
    name = models.CharField(max_length=50, choices=NAME_CHOICES)
    description = models.TextField(blank=True)
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    quantity_available = models.IntegerField(validators=[MinValueValidator(1)])
    quantity_sold = models.IntegerField(default=0, validators=[MinValueValidator(0)])

    # Sales period
    sales_start_date = models.DateTimeField()
    sales_end_date = models.DateTimeField()

    # Purchase limits
    min_purchase = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        help_text="Minimum number of tickets per order"
    )
    max_purchase = models.IntegerField(
        default=10,
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        help_text="Maximum number of tickets per order"
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['price']
        unique_together = ['event', 'name']

    def __str__(self):
        return f"{self.event.title} - {self.name}"

    def clean(self):
        """Validate ticket type fields"""
        if self.sales_end_date and self.sales_start_date:
            if self.sales_end_date <= self.sales_start_date:
                raise ValidationError('Sales end date must be after sales start date.')

        if self.quantity_sold is not None and self.quantity_available is not None:
            if self.quantity_sold > self.quantity_available:
                raise ValidationError('Quantity sold cannot exceed quantity available.')

        if self.max_purchase and self.min_purchase:
            if self.max_purchase < self.min_purchase:
                raise ValidationError('Maximum purchase must be greater than or equal to minimum purchase.')

    @property
    def available_quantity(self):
        """Get available quantity for this ticket type"""
        available = self.quantity_available if self.quantity_available is not None else 0
        sold = self.quantity_sold if self.quantity_sold is not None else 0
        return available - sold

    def is_available(self):
        """Check if ticket type is available for sale"""
        now = timezone.now()
        return (
            self.is_active and
            self.sales_start_date <= now <= self.sales_end_date and
            self.available_quantity > 0
        )


class PromoCode(models.Model):
    """Promo code model for discounts"""

    PERCENTAGE = 'PERCENTAGE'
    FIXED = 'FIXED'

    DISCOUNT_TYPE_CHOICES = [
        (PERCENTAGE, 'Percentage'),
        (FIXED, 'Fixed Amount'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='promo_codes'
    )
    code = models.CharField(max_length=50, unique=True)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE_CHOICES)
    discount_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    usage_limit = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1)])
    times_used = models.IntegerField(default=0, validators=[MinValueValidator(0)])

    # Validity period
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} - {self.event.title}"

    def save(self, *args, **kwargs):
        """Override save to uppercase code"""
        self.code = self.code.upper()
        super().save(*args, **kwargs)

    def clean(self):
        """Validate promo code fields"""
        if self.valid_until and self.valid_from:
            if self.valid_until <= self.valid_from:
                raise ValidationError('Valid until date must be after valid from date.')

        if self.discount_type == self.PERCENTAGE and self.discount_value and self.discount_value > 100:
            raise ValidationError('Percentage discount cannot exceed 100%.')

        if self.usage_limit and self.times_used is not None:
            if self.times_used > self.usage_limit:
                raise ValidationError('Times used cannot exceed usage limit.')

    def is_valid(self):
        """Check if promo code is valid"""
        # Return False if dates are not set (e.g., in Django admin before saving)
        if not self.valid_from or not self.valid_until:
            return False

        now = timezone.now()
        return (
            self.is_active and
            self.valid_from <= now <= self.valid_until
        )

    def can_be_used(self):
        """Check if promo code can be used"""
        if not self.is_valid():
            return False
        if self.usage_limit is None:
            return True
        return self.times_used < self.usage_limit

    def apply_discount(self, amount):
        """Apply discount to given amount"""
        if not self.can_be_used():
            raise ValidationError('Promo code cannot be used.')

        if self.discount_type == self.PERCENTAGE:
            discount = amount * (self.discount_value / 100)
        else:  # FIXED
            discount = self.discount_value

        # Ensure discount doesn't exceed total amount
        discount = min(discount, amount)
        return amount - discount


class EventAddOn(models.Model):
    """Event add-on model for additional services/products"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='addons'
    )
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    quantity_available = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)]
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.event.title}"

    @property
    def is_unlimited(self):
        """Check if add-on has unlimited quantity"""
        return self.quantity_available is None


class EventImage(models.Model):
    """Model for storing multiple event images"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='event_images'
    )
    image = models.ImageField(upload_to='events/gallery/')
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', '-created_at']

    def __str__(self):
        return f"Image for {self.event.title}"
