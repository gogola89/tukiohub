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
        Send email verification link to user (organizer or attendee) via Celery task

        Args:
            user_instance: User or Attendee instance
            verification_token: EmailVerification token instance
        """
        try:
            from .tasks import send_verification_email_task

            user_info = EmailService._get_user_info(user_instance)

            # Queue email sending task
            send_verification_email_task.delay(
                user_id=str(user_instance.id),
                verification_token_id=str(verification_token.id),
                user_type=user_info['type']
            )

            logger.info(f"Verification email task queued for {user_info['email']} ({user_info['type']})")
            return True

        except Exception as e:
            logger.error(f"Failed to queue verification email: {str(e)}")
            return False

    @staticmethod
    def send_password_reset_email(user_obj, password_reset, user_type='organizer'):
        """
        Send password reset link to user or attendee via Celery task

        Args:
            user_obj: User or Attendee instance
            password_reset: PasswordReset token instance
            user_type: 'organizer' or 'attendee' (default: 'organizer')
        """
        try:
            from .tasks import send_password_reset_email_task

            # Get user info
            user_info = EmailService._get_user_info(user_obj)

            # Queue email sending task
            send_password_reset_email_task.delay(
                user_id=str(user_obj.id),
                password_reset_id=str(password_reset.id),
                user_type=user_type
            )

            logger.info(f"Password reset email task queued for {user_info['email']} ({user_type})")
            return True

        except Exception as e:
            logger.error(f"Failed to queue password reset email: {str(e)}")
            return False

    @staticmethod
    def send_welcome_email(user_instance):
        """
        Send welcome email after email verification (for both organizers and attendees) via Celery task

        Args:
            user_instance: User or Attendee instance
        """
        try:
            from .tasks import send_welcome_email_task

            user_info = EmailService._get_user_info(user_instance)

            # Queue email sending task
            send_welcome_email_task.delay(
                user_id=str(user_instance.id),
                user_type=user_info['type']
            )

            logger.info(f"Welcome email task queued for {user_info['email']} ({user_info['type']})")
            return True

        except Exception as e:
            logger.error(f"Failed to queue welcome email: {str(e)}")
            return False

    @staticmethod
    def send_approval_email(user):
        """
        Send organizer approval notification email via Celery task

        Args:
            user: User instance
        """
        try:
            from .tasks import send_approval_email_task

            # Queue email sending task
            send_approval_email_task.delay(user_id=str(user.id))

            logger.info(f"Approval email task queued for {user.email}")
            return True

        except Exception as e:
            logger.error(f"Failed to queue approval email for {user.email}: {str(e)}")
            return False

    @staticmethod
    def send_rejection_email(user, reason=None):
        """
        Send organizer rejection notification email via Celery task

        Args:
            user: User instance
            reason: Optional reason for rejection
        """
        try:
            from .tasks import send_rejection_email_task

            # Queue email sending task
            send_rejection_email_task.delay(
                user_id=str(user.id),
                reason=reason
            )

            logger.info(f"Rejection email task queued for {user.email}")
            return True

        except Exception as e:
            logger.error(f"Failed to queue rejection email for {user.email}: {str(e)}")
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
