"""
Utility functions for generating JWT tokens for both User and Attendee models
"""

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.settings import api_settings
from .models import User, Attendee


def get_tokens_for_user(user):
    """
    Generate JWT tokens for User (organizer/admin) model

    Args:
        user: User model instance

    Returns:
        dict: Dictionary containing 'refresh' and 'access' tokens
    """
    refresh = RefreshToken.for_user(user)

    # Add custom claims
    refresh['user_type'] = 'organizer'
    refresh['email'] = user.email

    # Access token inherits claims from refresh token
    access = refresh.access_token

    return {
        'refresh': str(refresh),
        'access': str(access),
    }


def get_tokens_for_attendee(attendee):
    """
    Generate JWT tokens for Attendee model

    Args:
        attendee: Attendee model instance

    Returns:
        dict: Dictionary containing 'refresh' and 'access' tokens
    """
    # Create base refresh token
    # Note: We can't use for_user() since Attendee is not the AUTH_USER_MODEL
    # but we need to manually set the user_id in the token payload
    refresh = RefreshToken()

    # Set the user_id claim properly (this is what JWT library expects)
    # The library uses this claim to identify the user
    # Get the claim name from settings (default is 'user_id')
    user_id_claim = api_settings.USER_ID_CLAIM
    refresh[user_id_claim] = str(attendee.id)

    # Add custom claims
    refresh['user_type'] = 'attendee'
    refresh['email'] = attendee.email

    # Access token automatically inherits claims from refresh token
    access = refresh.access_token

    return {
        'refresh': str(refresh),
        'access': str(access),
    }
