"""
Tests for user services (email, token generation)
"""

import pytest
from django.core import mail
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from apps.users.services import (
    EmailService,
    generate_verification_token,
    verify_token
)
from apps.users.models import EmailVerification

User = get_user_model()


@pytest.mark.django_db
class TestEmailService:
    """Test email service functionality"""

    def test_send_verification_email(self):
        """Test sending verification email"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            phone_number='+254712345678'
        )
        verification = generate_verification_token(user)

        # Send verification email
        result = EmailService.send_verification_email(user, verification)

        # Check email was sent
        assert result is True
        assert len(mail.outbox) == 1
        assert mail.outbox[0].subject == 'Welcome to TukioHub - Verify Your Email'
        assert mail.outbox[0].to == [user.email]
        assert verification.token in mail.outbox[0].body

    def test_send_password_reset_email(self):
        """Test sending password reset email"""
        from apps.users.models import PasswordReset
        import secrets

        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            phone_number='+254712345678'
        )

        # Create password reset token
        password_reset = PasswordReset.objects.create(
            user=user,
            token=secrets.token_urlsafe(32),
            expires_at=timezone.now() + timedelta(hours=24)
        )

        # Send password reset email
        result = EmailService.send_password_reset_email(user, password_reset)

        # Check email was sent
        assert result is True
        assert len(mail.outbox) == 1
        assert mail.outbox[0].subject == 'TukioHub - Password Reset Request'
        assert mail.outbox[0].to == [user.email]
        assert password_reset.token in mail.outbox[0].body

    def test_send_welcome_email(self):
        """Test sending welcome email"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            phone_number='+254712345678',
            company_name='Test Company'
        )

        # Send welcome email
        result = EmailService.send_welcome_email(user)

        # Check email was sent
        assert result is True
        assert len(mail.outbox) == 1
        assert mail.outbox[0].subject == 'Welcome to TukioHub!'
        assert mail.outbox[0].to == [user.email]


@pytest.mark.django_db
class TestTokenGeneration:
    """Test token generation and verification"""

    def test_generate_verification_token(self):
        """Test generating email verification token"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            phone_number='+254712345678'
        )

        verification = generate_verification_token(user)

        assert verification is not None
        assert verification.user == user
        assert verification.token is not None
        assert len(verification.token) > 20
        assert verification.used is False
        assert verification.expires_at > timezone.now()

    def test_generate_verification_token_invalidates_old(self):
        """Test that new token invalidates old tokens"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            phone_number='+254712345678'
        )

        # Generate first token
        verification1 = generate_verification_token(user)

        # Generate second token
        verification2 = generate_verification_token(user)

        # Refresh first token from database
        verification1.refresh_from_db()

        # First token should be marked as used
        assert verification1.used is True
        assert verification2.used is False

    def test_verify_token_success(self):
        """Test successful token verification"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            phone_number='+254712345678'
        )

        verification = generate_verification_token(user)

        # Verify token
        success, message, verified_user = verify_token(verification.token)

        assert success is True
        assert 'success' in message.lower()
        assert verified_user == user

        # Check user is marked as verified
        user.refresh_from_db()
        assert user.email_verified is True

        # Check token is marked as used
        verification.refresh_from_db()
        assert verification.used is True

    def test_verify_token_already_used(self):
        """Test verifying already used token"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            phone_number='+254712345678'
        )

        verification = generate_verification_token(user)

        # Verify once
        verify_token(verification.token)

        # Try to verify again
        success, message, verified_user = verify_token(verification.token)

        assert success is False
        assert 'already been used' in message
        assert verified_user is None

    def test_verify_token_expired(self):
        """Test verifying expired token"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            phone_number='+254712345678'
        )

        # Create expired token
        verification = EmailVerification.objects.create(
            user=user,
            token='expired_token',
            expires_at=timezone.now() - timedelta(hours=1)  # Expired
        )

        # Try to verify
        success, message, verified_user = verify_token(verification.token)

        assert success is False
        assert 'expired' in message.lower()
        assert verified_user is None

    def test_verify_token_invalid(self):
        """Test verifying invalid token"""
        success, message, verified_user = verify_token('invalid_token')

        assert success is False
        assert 'invalid' in message.lower()
        assert verified_user is None
