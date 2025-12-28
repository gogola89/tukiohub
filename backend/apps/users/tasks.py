"""
Celery tasks for user authentication and email notifications
"""

from celery import shared_task
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def send_verification_email_task(self, user_id, verification_token_id, user_type='organizer'):
    """
    Send email verification link to user (organizer or attendee)

    Args:
        user_id: ID of the User or Attendee instance
        verification_token_id: ID of the EmailVerification token instance
        user_type: 'organizer' or 'attendee'
    """
    try:
        from .models import User, Attendee, EmailVerification

        # Get user and token instances
        verification_token = EmailVerification.objects.get(id=verification_token_id)

        if user_type == 'organizer':
            user_instance = User.objects.get(id=user_id)
            user_info = {
                'email': user_instance.email,
                'name': user_instance.company_name or user_instance.email.split('@')[0],
                'type': 'organizer',
            }
        else:
            user_instance = Attendee.objects.get(id=user_id)
            user_info = {
                'email': user_instance.email,
                'name': user_instance.full_name,
                'first_name': user_instance.first_name,
                'last_name': user_instance.last_name,
                'type': 'attendee',
            }

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
        logger.error(f"Failed to send verification email: {str(e)}", exc_info=True)
        # Retry task
        raise self.retry(exc=e, countdown=60)


@shared_task(bind=True, max_retries=3)
def send_password_reset_email_task(self, user_id, password_reset_id, user_type='organizer'):
    """
    Send password reset link to user or attendee

    Args:
        user_id: ID of the User or Attendee instance
        password_reset_id: ID of the PasswordReset token instance
        user_type: 'organizer' or 'attendee'
    """
    try:
        from .models import User, Attendee, PasswordReset

        # Get user and password reset instances
        password_reset = PasswordReset.objects.get(id=password_reset_id)

        if user_type == 'organizer':
            user_obj = User.objects.get(id=user_id)
            user_info = {
                'email': user_obj.email,
                'name': user_obj.company_name or user_obj.email.split('@')[0],
            }
        else:
            user_obj = Attendee.objects.get(id=user_id)
            user_info = {
                'email': user_obj.email,
                'name': user_obj.full_name,
            }

        # Frontend URL for password reset
        frontend_url = settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else 'http://localhost:3000'
        reset_link = f"{frontend_url}/reset-password?token={password_reset.token}"

        # Render email templates
        subject = 'TukioHub - Password Reset Request'
        html_message = render_to_string('emails/password_reset_email.html', {
            'user': user_obj,
            'reset_link': reset_link,
            'reset_url': reset_link,
            'expiry_hours': 24,
            'user_type': user_type,
            'first_name': user_info['name'],
        })
        plain_message = render_to_string('emails/password_reset_email.txt', {
            'user': user_obj,
            'reset_link': reset_link,
            'reset_url': reset_link,
            'expiry_hours': 24,
            'user_type': user_type,
            'first_name': user_info['name'],
        })

        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_info['email']],
            html_message=html_message,
            fail_silently=False,
        )

        logger.info(f"Password reset email sent to {user_info['email']} ({user_type})")
        return True

    except Exception as e:
        logger.error(f"Failed to send password reset email: {str(e)}", exc_info=True)
        # Retry task
        raise self.retry(exc=e, countdown=60)


@shared_task(bind=True, max_retries=3)
def send_welcome_email_task(self, user_id, user_type='organizer'):
    """
    Send welcome email after email verification (for both organizers and attendees)

    Args:
        user_id: ID of the User or Attendee instance
        user_type: 'organizer' or 'attendee'
    """
    try:
        from .models import User, Attendee

        if user_type == 'organizer':
            user_instance = User.objects.get(id=user_id)
            user_info = {
                'email': user_instance.email,
                'name': user_instance.company_name or user_instance.email.split('@')[0],
                'type': 'organizer',
            }
        else:
            user_instance = Attendee.objects.get(id=user_id)
            user_info = {
                'email': user_instance.email,
                'name': user_instance.full_name,
                'first_name': user_instance.first_name,
                'last_name': user_instance.last_name,
                'type': 'attendee',
            }

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
        logger.error(f"Failed to send welcome email: {str(e)}", exc_info=True)
        # Retry task
        raise self.retry(exc=e, countdown=60)


@shared_task(bind=True, max_retries=3)
def send_approval_email_task(self, user_id):
    """
    Send organizer approval notification email

    Args:
        user_id: ID of the User instance
    """
    try:
        from .models import User

        user = User.objects.get(id=user_id)

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
        logger.error(f"Failed to send approval email: {str(e)}", exc_info=True)
        # Retry task
        raise self.retry(exc=e, countdown=60)


@shared_task(bind=True, max_retries=3)
def send_rejection_email_task(self, user_id, reason=None):
    """
    Send organizer rejection notification email

    Args:
        user_id: ID of the User instance
        reason: Optional reason for rejection
    """
    try:
        from .models import User

        user = User.objects.get(id=user_id)

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
        logger.error(f"Failed to send rejection email: {str(e)}", exc_info=True)
        # Retry task
        raise self.retry(exc=e, countdown=60)
