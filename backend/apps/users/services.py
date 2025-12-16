"""
Service functions for user authentication and email management
"""

import secrets
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from .models import User, PasswordReset
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails to users"""

    @staticmethod
    def send_verification_email(user, verification_token):
        """
        Send email verification link to user

        Args:
            user: User instance
            verification_token: EmailVerification token instance
        """
        try:
            # Frontend URL for email verification
            frontend_url = settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else 'http://localhost:3000'
            verification_link = f"{frontend_url}/verify-email?token={verification_token.token}"

            # Render email templates
            subject = 'Welcome to TukioHub - Verify Your Email'
            html_message = render_to_string('emails/verification_email.html', {
                'user': user,
                'verification_link': verification_link,
                'expiry_hours': 24,
            })
            plain_message = render_to_string('emails/verification_email.txt', {
                'user': user,
                'verification_link': verification_link,
                'expiry_hours': 24,
            })

            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )

            logger.info(f"Verification email sent to {user.email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send verification email to {user.email}: {str(e)}")
            return False

    @staticmethod
    def send_password_reset_email(user, password_reset):
        """
        Send password reset link to user

        Args:
            user: User instance
            password_reset: PasswordReset token instance
        """
        try:
            # Frontend URL for password reset
            frontend_url = settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else 'http://localhost:3000'
            reset_link = f"{frontend_url}/reset-password?token={password_reset.token}"

            # Render email templates
            subject = 'TukioHub - Password Reset Request'
            html_message = render_to_string('emails/password_reset_email.html', {
                'user': user,
                'reset_link': reset_link,
                'expiry_hours': 24,
            })
            plain_message = render_to_string('emails/password_reset_email.txt', {
                'user': user,
                'reset_link': reset_link,
                'expiry_hours': 24,
            })

            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )

            logger.info(f"Password reset email sent to {user.email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send password reset email to {user.email}: {str(e)}")
            return False

    @staticmethod
    def send_welcome_email(user):
        """
        Send welcome email after email verification

        Args:
            user: User instance
        """
        try:
            subject = 'Welcome to TukioHub!'
            html_message = render_to_string('emails/welcome_email.html', {
                'user': user,
            })
            plain_message = render_to_string('emails/welcome_email.txt', {
                'user': user,
            })

            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )

            logger.info(f"Welcome email sent to {user.email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send welcome email to {user.email}: {str(e)}")
            return False


def generate_verification_token(user):
    """
    Generate email verification token for user

    Args:
        user: User instance

    Returns:
        EmailVerification instance
    """
    from .models import EmailVerification

    # Invalidate any existing tokens
    EmailVerification.objects.filter(user=user, used=False).update(used=True)

    # Generate new token
    token = secrets.token_urlsafe(32)
    expires_at = timezone.now() + timedelta(hours=24)

    verification = EmailVerification.objects.create(
        user=user,
        token=token,
        expires_at=expires_at
    )

    return verification


def verify_token(token):
    """
    Verify email verification token

    Args:
        token: Token string

    Returns:
        tuple: (success: bool, message: str, user: User or None)
    """
    from .models import EmailVerification

    try:
        verification = EmailVerification.objects.get(token=token)

        if verification.used:
            return False, "This verification link has already been used.", None

        if not verification.is_valid:
            return False, "This verification link has expired.", None

        # Mark token as used
        verification.used = True
        verification.save()

        # Mark user email as verified (we'll add this field)
        user = verification.user
        user.email_verified = True
        user.save()

        return True, "Email verified successfully!", user

    except EmailVerification.DoesNotExist:
        return False, "Invalid verification link.", None
