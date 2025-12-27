"""
Quick test script for password reset functionality
Run with: python manage.py shell < test_password_reset.py
"""
from apps.users.models import User, Attendee, PasswordReset
from django.utils import timezone
from datetime import timedelta
import secrets

print("\n=== Password Reset Test ===\n")

# Test with an organizer
try:
    organizer = User.objects.first()
    if organizer:
        print(f"Testing with Organizer: {organizer.email}")
        
        # Create a password reset token
        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(hours=24)
        
        reset = PasswordReset.objects.create(
            user=organizer,
            token=token,
            expires_at=expires_at
        )
        
        print(f"✓ Created password reset for organizer")
        print(f"  Token: {token}")
        print(f"  Reset URL: http://localhost:3000/reset-password?token={token}")
        print(f"  Expires: {expires_at}")
        print()
except Exception as e:
    print(f"✗ Error testing organizer: {e}\n")

# Test with an attendee  
try:
    attendee = Attendee.objects.first()
    if attendee:
        print(f"Testing with Attendee: {attendee.email}")
        
        # Create a password reset token
        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(hours=24)
        
        reset = PasswordReset.objects.create(
            attendee=attendee,
            token=token,
            expires_at=expires_at
        )
        
        print(f"✓ Created password reset for attendee")
        print(f"  Token: {token}")
        print(f"  Reset URL: http://localhost:3000/reset-password?token={token}")
        print(f"  Expires: {expires_at}")
        print()
except Exception as e:
    print(f"✗ Error testing attendee: {e}\n")

print("\n=== Test Complete ===")
print("Note: In production, these tokens would be sent via email.")
print("For testing, copy the Reset URL above and paste it in your browser.")
