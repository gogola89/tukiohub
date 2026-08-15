"""
Tests for User models
"""

import pytest
from django.contrib.auth import get_user_model
from apps.users.models import PasswordReset
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


@pytest.mark.django_db
class TestUserModel:
    """Tests for User model"""

    def test_create_user(self):
        """Test creating a regular user"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            phone_number='+254712345678'
        )
        assert user.email == 'test@example.com'
        assert user.check_password('testpass123')
        assert user.is_active
        assert not user.is_staff
        assert not user.is_superuser

    def test_create_superuser(self):
        """Test creating a superuser"""
        user = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123',
            phone_number='+254712345678'
        )
        assert user.is_staff
        assert user.is_superuser
        assert user.is_active

    def test_user_str(self):
        """Test user string representation"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            phone_number='+254712345678'
        )
        assert str(user) == 'test@example.com'

    def test_user_auto_username(self):
        """Test username is auto-generated from the full email (avoids cross-domain collisions)"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            phone_number='+254712345678'
        )
        assert user.username == 'test@example.com'

    def test_user_is_organizer_property(self):
        """Test is_organizer property"""
        user = User.objects.create_user(
            email='organizer@example.com',
            password='testpass123',
            phone_number='+254712345678',
            role=User.ORGANIZER
        )
        assert user.is_organizer
        assert not user.is_admin_user

    def test_user_is_admin_property(self):
        """Test is_admin_user property"""
        user = User.objects.create_user(
            email='admin@example.com',
            password='testpass123',
            phone_number='+254712345678',
            role=User.ADMIN
        )
        assert user.is_admin_user
        assert not user.is_organizer

    def test_user_is_verified_property(self):
        """Test is_verified property"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            phone_number='+254712345678'
        )
        assert not user.is_verified

        user.verification_status = User.APPROVED
        user.save()
        assert user.is_verified


@pytest.mark.django_db
class TestPasswordResetModel:
    """Tests for PasswordReset model"""

    def test_create_password_reset(self):
        """Test creating a password reset token"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            phone_number='+254712345678'
        )
        reset = PasswordReset.objects.create(
            user=user,
            token='test-token-123',
            expires_at=timezone.now() + timedelta(hours=24)
        )
        assert reset.user == user
        assert reset.token == 'test-token-123'
        assert not reset.used

    def test_password_reset_str(self):
        """Test password reset string representation"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            phone_number='+254712345678'
        )
        reset = PasswordReset.objects.create(
            user=user,
            token='test-token-123',
            expires_at=timezone.now() + timedelta(hours=24)
        )
        assert str(reset) == 'Password reset for test@example.com'

    def test_password_reset_is_valid(self):
        """Test is_valid property"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            phone_number='+254712345678'
        )

        # Valid token
        valid_reset = PasswordReset.objects.create(
            user=user,
            token='valid-token',
            expires_at=timezone.now() + timedelta(hours=24)
        )
        assert valid_reset.is_valid

        # Used token
        used_reset = PasswordReset.objects.create(
            user=user,
            token='used-token',
            expires_at=timezone.now() + timedelta(hours=24),
            used=True
        )
        assert not used_reset.is_valid

        # Expired token
        expired_reset = PasswordReset.objects.create(
            user=user,
            token='expired-token',
            expires_at=timezone.now() - timedelta(hours=1)
        )
        assert not expired_reset.is_valid
