"""
User models for TukioHub
"""

import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _


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
