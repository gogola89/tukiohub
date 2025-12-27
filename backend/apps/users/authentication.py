"""
Custom JWT authentication backend to handle both User and Attendee models
"""

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed, TokenError
from rest_framework_simplejwt.settings import api_settings
from rest_framework.exceptions import AuthenticationFailed as DRFAuthenticationFailed
from django.contrib.auth import get_user_model
from .models import Attendee

User = get_user_model()


class DualUserJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that supports both User and Attendee models

    This authentication backend checks the 'user_type' claim in the JWT token
    to determine whether to look up the user in the User or Attendee model.

    Returns None for missing/invalid tokens on public endpoints (AllowAny permission)
    """

    def authenticate(self, request):
        """
        Override authenticate to handle missing/invalid tokens gracefully
        Returns None for missing Authorization header (allows AllowAny endpoints)
        Returns None for invalid tokens (lets permission classes handle authorization)
        """
        header = self.get_header(request)
        if header is None:
            # No Authorization header - return None (allows public access)
            return None

        # Authorization header exists - try to validate it
        # If validation fails, return None to allow AllowAny endpoints to work
        # Permission classes will still enforce authentication requirements
        try:
            return super().authenticate(request)
        except (InvalidToken, AuthenticationFailed, TokenError):
            # Invalid/expired token - return None instead of raising
            # This allows public endpoints (AllowAny) to work with invalid tokens
            # Authenticated endpoints (IsAuthenticated) will still fail at permission check
            return None

    def get_user(self, validated_token):
        """
        Attempts to find and return a user using the given validated token.
        Checks user_type claim to determine which model to query.
        """
        try:
            user_type = validated_token.get('user_type', 'organizer')
            user_id_claim = api_settings.USER_ID_CLAIM
            user_id = validated_token.get(user_id_claim)

            if user_type == 'attendee':
                # Look up in Attendee model
                try:
                    user = Attendee.objects.get(id=user_id)
                    return user
                except Attendee.DoesNotExist:
                    raise InvalidToken('User not found')
            else:
                # Look up in User model (organizers/admins)
                try:
                    user = User.objects.get(id=user_id)
                    return user
                except User.DoesNotExist:
                    raise InvalidToken('User not found')

        except KeyError:
            raise InvalidToken('Token contained no recognizable user identification')
