#!/usr/bin/env python
"""
Quick test script to verify authentication is working
Run this from the backend directory: python test_auth.py
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.users.models import User, Attendee
from apps.users.tokens import get_tokens_for_user, get_tokens_for_attendee
from apps.users.authentication import DualUserJWTAuthentication
from rest_framework.test import APIRequestFactory
from rest_framework_simplejwt.tokens import RefreshToken

def test_organizer_tokens():
    """Test organizer token generation and validation"""
    print("\n=== Testing Organizer Authentication ===")

    # Create a test organizer
    try:
        user = User.objects.filter(email='test_organizer@example.com').first()
        if not user:
            user = User.objects.create_user(
                email='test_organizer@example.com',
                password='TestPass123!',
                company_name='Test Company',
                phone_number='254712345678'
            )
            print("✓ Created test organizer")
        else:
            print("✓ Using existing test organizer")

        # Generate tokens
        tokens = get_tokens_for_user(user)
        print(f"✓ Generated tokens")
        print(f"  Access token (first 50 chars): {tokens['access'][:50]}...")

        # Decode and verify token structure
        refresh = RefreshToken(tokens['refresh'])
        print(f"✓ Token claims:")
        print(f"  - user_id: {refresh.get('user_id')}")
        print(f"  - user_type: {refresh.get('user_type')}")
        print(f"  - email: {refresh.get('email')}")

        # Test authentication
        factory = APIRequestFactory()
        request = factory.get('/api/auth/me/')
        request.META['HTTP_AUTHORIZATION'] = f'Bearer {tokens["access"]}'

        auth = DualUserJWTAuthentication()
        result = auth.authenticate(request)

        if result:
            authenticated_user, _ = result
            print(f"✓ Authentication successful!")
            print(f"  - Authenticated as: {authenticated_user.email}")
            print(f"  - User type: {type(authenticated_user).__name__}")
        else:
            print("✗ Authentication failed - returned None")

    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()

def test_attendee_tokens():
    """Test attendee token generation and validation"""
    print("\n=== Testing Attendee Authentication ===")

    try:
        # Create a test attendee
        attendee = Attendee.objects.filter(email='test_attendee@example.com').first()
        if not attendee:
            attendee = Attendee.objects.create_user(
                email='test_attendee@example.com',
                password='TestPass123!',
                first_name='Test',
                last_name='Attendee',
                phone_number='254712345678'
            )
            print("✓ Created test attendee")
        else:
            print("✓ Using existing test attendee")

        # Generate tokens
        tokens = get_tokens_for_attendee(attendee)
        print(f"✓ Generated tokens")
        print(f"  Access token (first 50 chars): {tokens['access'][:50]}...")

        # Decode and verify token structure
        refresh = RefreshToken(tokens['refresh'])
        print(f"✓ Token claims:")
        print(f"  - user_id: {refresh.get('user_id')}")
        print(f"  - user_type: {refresh.get('user_type')}")
        print(f"  - email: {refresh.get('email')}")

        # Test authentication
        factory = APIRequestFactory()
        request = factory.get('/api/attendees/profile/')
        request.META['HTTP_AUTHORIZATION'] = f'Bearer {tokens["access"]}'

        auth = DualUserJWTAuthentication()
        result = auth.authenticate(request)

        if result:
            authenticated_user, _ = result
            print(f"✓ Authentication successful!")
            print(f"  - Authenticated as: {authenticated_user.email}")
            print(f"  - User type: {type(authenticated_user).__name__}")
        else:
            print("✗ Authentication failed - returned None")

    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()

def test_public_access():
    """Test that public endpoints work without authentication"""
    print("\n=== Testing Public Access ===")

    try:
        factory = APIRequestFactory()
        request = factory.get('/api/public/events/')
        # No Authorization header

        auth = DualUserJWTAuthentication()
        result = auth.authenticate(request)

        if result is None:
            print("✓ Public access works (returned None as expected)")
        else:
            print("✗ Public access failed - should return None")

    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    print("=" * 60)
    print("Authentication System Test")
    print("=" * 60)

    test_organizer_tokens()
    test_attendee_tokens()
    test_public_access()

    print("\n" + "=" * 60)
    print("Test Complete!")
    print("=" * 60)
    print("\nIf all tests passed, the authentication system is working correctly.")
    print("If you're still getting 401 errors, make sure to:")
    print("  1. Clear old tokens from your frontend")
    print("  2. Login again to get new tokens")
    print("  3. Check that Authorization header is formatted as: Bearer <token>")
