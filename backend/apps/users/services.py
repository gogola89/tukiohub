"""
Service functions for user authentication and email management
"""

import secrets
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from .models import User, Attendee, PasswordReset
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails to users (both User and Attendee models)"""

    @staticmethod
    def _get_user_info(user_instance):
        """
        Get user information from either User or Attendee instance

        Args:
            user_instance: User or Attendee instance

        Returns:
            dict: User information including name, email, and type
        """
        if isinstance(user_instance, User):
            return {
                'email': user_instance.email,
                'name': user_instance.company_name or user_instance.email.split('@')[0],
                'type': 'organizer',
                'is_organizer': True,
                'is_attendee': False,
            }
        elif isinstance(user_instance, Attendee):
            return {
                'email': user_instance.email,
                'name': user_instance.full_name,
                'first_name': user_instance.first_name,
                'last_name': user_instance.last_name,
                'type': 'attendee',
                'is_organizer': False,
                'is_attendee': True,
            }
        else:
            raise ValueError("user_instance must be either User or Attendee")

    @staticmethod
    def send_verification_email(user_instance, verification_token):
        """
        Send email verification link to user (organizer or attendee)

        Args:
            user_instance: User or Attendee instance
            verification_token: EmailVerification token instance
        """
        try:
            user_info = EmailService._get_user_info(user_instance)

            # Frontend URL for email verification
            frontend_url = settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else 'http://localhost:3000'
            verification_link = f"{frontend_url}/verify-email?token={verification_token.token}"

            # Render email templates
            subject = 'Welcome to TukioHub - Verify Your Email'
            context = {
                'user': user_instance,
                'user_info': user_info,
                'verification_link': verification_link,
                'expiry_hours': 24,
            }

            html_message = render_to_string('emails/verification_email.html', context)
            plain_message = render_to_string('emails/verification_email.txt', context)

            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user_info['email']],
                html_message=html_message,
                fail_silently=False,
            )

            logger.info(f"Verification email sent to {user_info['email']} ({user_info['type']})")
            return True

        except Exception as e:
            logger.error(f"Failed to send verification email: {str(e)}")
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
    def send_welcome_email(user_instance):
        """
        Send welcome email after email verification (for both organizers and attendees)

        Args:
            user_instance: User or Attendee instance
        """
        try:
            user_info = EmailService._get_user_info(user_instance)

            subject = 'Welcome to TukioHub!'
            context = {
                'user': user_instance,
                'user_info': user_info,
            }

            html_message = render_to_string('emails/welcome_email.html', context)
            plain_message = render_to_string('emails/welcome_email.txt', context)

            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user_info['email']],
                html_message=html_message,
                fail_silently=False,
            )

            logger.info(f"Welcome email sent to {user_info['email']} ({user_info['type']})")
            return True

        except Exception as e:
            logger.error(f"Failed to send welcome email: {str(e)}")
            return False

    @staticmethod
    def send_approval_email(user):
        """
        Send organizer approval notification email

        Args:
            user: User instance
        """
        try:
            subject = 'TukioHub - Your Organizer Account Has Been Approved!'
            html_message = render_to_string('emails/organizer_approved.html', {
                'user': user,
            })
            plain_message = render_to_string('emails/organizer_approved.txt', {
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

            logger.info(f"Approval email sent to {user.email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send approval email to {user.email}: {str(e)}")
            return False

    @staticmethod
    def send_rejection_email(user, reason=None):
        """
        Send organizer rejection notification email

        Args:
            user: User instance
            reason: Optional reason for rejection
        """
        try:
            subject = 'TukioHub - Update on Your Organizer Application'
            html_message = render_to_string('emails/organizer_rejected.html', {
                'user': user,
                'reason': reason,
            })
            plain_message = render_to_string('emails/organizer_rejected.txt', {
                'user': user,
                'reason': reason,
            })

            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )

            logger.info(f"Rejection email sent to {user.email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send rejection email to {user.email}: {str(e)}")
            return False


def generate_verification_token(user_instance):
    """
    Generate email verification token for user (organizer or attendee)

    Args:
        user_instance: User or Attendee instance

    Returns:
        EmailVerification instance
    """
    from .models import EmailVerification

    # Determine which field to use
    is_organizer = isinstance(user_instance, User)

    # Invalidate any existing tokens for this user
    if is_organizer:
        EmailVerification.objects.filter(user=user_instance, used=False).update(used=True)
    else:
        EmailVerification.objects.filter(attendee=user_instance, used=False).update(used=True)

    # Generate new token
    token = secrets.token_urlsafe(32)
    expires_at = timezone.now() + timedelta(hours=24)

    # Create verification record
    if is_organizer:
        verification = EmailVerification.objects.create(
            user=user_instance,
            token=token,
            expires_at=expires_at
        )
    else:
        verification = EmailVerification.objects.create(
            attendee=user_instance,
            token=token,
            expires_at=expires_at
        )

    return verification


def verify_token(token):
    """
    Verify email verification token (for both organizers and attendees)

    Args:
        token: Token string

    Returns:
        tuple: (success: bool, message: str, user: User or Attendee or None)
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

        # Get the user instance (either User or Attendee)
        user_instance = verification.get_user_instance

        # Mark email as verified
        user_instance.email_verified = True
        user_instance.save()

        return True, "Email verified successfully!", user_instance

    except EmailVerification.DoesNotExist:
        return False, "Invalid verification link.", None
