"""
User models for TukioHub
"""

import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser, AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.core.validators import MinValueValidator
from django.utils.translation import gettext_lazy as _
from django.utils import timezone


class UserManager(BaseUserManager):
    """
    Custom user manager for email-based authentication
    """

    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user with the given email and password"""
        if not email:
            raise ValueError(_('The Email field must be set'))

        email = self.normalize_email(email)
        extra_fields.setdefault('username', email.split('@')[0])
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser with the given email and password"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'ADMIN')

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Custom User model for TukioHub
    Supports both organizers and administrators
    """

    # Role choices
    ORGANIZER = 'ORGANIZER'
    ADMIN = 'ADMIN'

    ROLE_CHOICES = [
        (ORGANIZER, 'Event Organizer'),
        (ADMIN, 'Administrator'),
    ]

    # Verification status choices
    PENDING = 'PENDING'
    APPROVED = 'APPROVED'
    REJECTED = 'REJECTED'

    VERIFICATION_STATUS_CHOICES = [
        (PENDING, 'Pending Verification'),
        (APPROVED, 'Approved'),
        (REJECTED, 'Rejected'),
    ]

    # Primary fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('email address'), unique=True)
    username = models.CharField(max_length=150, unique=True, blank=True, null=True)

    # Profile fields
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ORGANIZER)
    company_name = models.CharField(max_length=255, blank=True)
    phone_number = models.CharField(max_length=20)
    logo = models.ImageField(upload_to='logos/', blank=True, null=True)

    # Verification fields
    verification_status = models.CharField(
        max_length=20,
        choices=VERIFICATION_STATUS_CHOICES,
        default=PENDING
    )
    verification_documents = models.JSONField(default=list, blank=True)
    email_verified = models.BooleanField(default=False)

    # Status fields
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Use email as the unique identifier
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['phone_number']

    # Use custom user manager
    objects = UserManager()

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role', 'verification_status']),
        ]
        verbose_name = _('user')
        verbose_name_plural = _('users')

    def __str__(self):
        return self.email

    def save(self, *args, **kwargs):
        # Auto-generate username from email if not provided
        if not self.username:
            self.username = self.email.split('@')[0]
        super().save(*args, **kwargs)

    @property
    def is_organizer(self):
        """Check if user is an organizer"""
        return self.role == self.ORGANIZER

    @property
    def is_admin_user(self):
        """Check if user is an admin"""
        return self.role == self.ADMIN

    @property
    def is_verified(self):
        """Check if organizer is verified"""
        return self.verification_status == self.APPROVED


class AttendeeManager(BaseUserManager):
    """
    Custom attendee manager for email-based authentication
    """

    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular attendee with the given email and password"""
        if not email:
            raise ValueError(_('The Email field must be set'))

        email = self.normalize_email(email)
        attendee = self.model(email=email, **extra_fields)
        attendee.set_password(password)
        attendee.save(using=self._db)
        return attendee

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser attendee (if needed)"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(email, password, **extra_fields)


class Attendee(AbstractBaseUser):
    """
    Model for system users who attend events
    Separate from organizers to allow for different registration flows
    """

    # Role choices for attendees
    REGULAR = 'REGULAR'
    VIP = 'VIP'
    PREMIUM = 'PREMIUM'

    ROLE_CHOICES = [
        (REGULAR, 'Regular User'),
        (VIP, 'VIP User'),
        (PREMIUM, 'Premium User'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('email address'), unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    phone_number = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=REGULAR)

    # Wallet functionality
    wallet_balance = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )

    # Verification
    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)

    # Status fields
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_subscribed = models.BooleanField(default=False)  # For newsletter/promos
    date_joined = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    # Use custom manager
    objects = AttendeeManager()

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
        ]
        verbose_name = _('attendee')
        verbose_name_plural = _('attendees')

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

    @property
    def full_name(self):
        """Get full name of the attendee"""
        return f"{self.first_name} {self.last_name}"

    def add_to_wallet(self, amount):
        """Add money to wallet"""
        if amount <= 0:
            raise ValueError("Amount must be positive")
        self.wallet_balance += amount
        self.save()

    def withdraw_from_wallet(self, amount):
        """Withdraw money from wallet"""
        if amount <= 0:
            raise ValueError("Amount must be positive")
        if amount > self.wallet_balance:
            raise ValueError("Insufficient funds")
        self.wallet_balance -= amount
        self.save()

    def can_afford(self, amount):
        """Check if attendee can afford a purchase"""
        return self.wallet_balance >= amount



class WalletTransaction(models.Model):
    """
    Model to track wallet transactions for attendees
    """

    DEPOSIT = 'DEPOSIT'
    WITHDRAWAL = 'WITHDRAWAL'
    BOOKING = 'BOOKING'
    REFUND = 'REFUND'
    PROMO_CREDIT = 'PROMO_CREDIT'

    TRANSACTION_TYPE_CHOICES = [
        (DEPOSIT, 'Deposit'),
        (WITHDRAWAL, 'Withdrawal'),
        (BOOKING, 'Booking Payment'),
        (REFUND, 'Refund'),
        (PROMO_CREDIT, 'Promo Credit'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    attendee = models.ForeignKey(
        Attendee,
        on_delete=models.CASCADE,
        related_name='wallet_transactions'
    )
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES)
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    description = models.TextField(blank=True)

    # Related booking (if applicable)
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['attendee', 'created_at']),
            models.Index(fields=['transaction_type']),
        ]

    def __str__(self):
        return f"{self.transaction_type} - {self.amount} for {self.attendee.email}"


class PasswordReset(models.Model):
    """
    Model to handle password reset tokens
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_resets')
    token = models.CharField(max_length=255, unique=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['user', 'used']),
        ]
        verbose_name = _('password reset')
        verbose_name_plural = _('password resets')

    def __str__(self):
        return f"Password reset for {self.user.email}"

    @property
    def is_valid(self):
        """Check if token is still valid"""
        from django.utils import timezone
        return not self.used and self.expires_at > timezone.now()


class EmailVerification(models.Model):
    """
    Model to handle email verification tokens for both User and Attendee models
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Support both User (organizers) and Attendee models
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='email_verifications',
        null=True,
        blank=True
    )
    attendee = models.ForeignKey(
        'Attendee',
        on_delete=models.CASCADE,
        related_name='email_verifications',
        null=True,
        blank=True
    )
    token = models.CharField(max_length=255, unique=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['user', 'used']),
            models.Index(fields=['attendee', 'used']),
        ]
        verbose_name = _('email verification')
        verbose_name_plural = _('email verifications')
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(user__isnull=False, attendee__isnull=True) |
                    models.Q(user__isnull=True, attendee__isnull=False)
                ),
                name='email_verification_user_xor_attendee'
            )
        ]

    def __str__(self):
        if self.user:
            return f"Email verification for {self.user.email}"
        elif self.attendee:
            return f"Email verification for {self.attendee.email}"
        return f"Email verification {self.id}"

    @property
    def is_valid(self):
        """Check if token is still valid"""
        from django.utils import timezone
        return not self.used and self.expires_at > timezone.now()

    @property
    def get_user_instance(self):
        """Get the user instance (either User or Attendee)"""
        return self.user if self.user else self.attendee

    @property
    def get_email(self):
        """Get the email of the user"""
        instance = self.get_user_instance
        return instance.email if instance else None
