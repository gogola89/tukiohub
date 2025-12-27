#!/usr/bin/env python
"""
Test script to verify attendee email verification flow
Run this from the backend directory: python test_attendee_emails.py
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.users.models import Attendee, EmailVerification
from apps.users.services import generate_verification_token, verify_token, EmailService

def test_attendee_email_flow():
    """Test complete email flow for attendees"""
    print("\n" + "=" * 70)
    print("TESTING ATTENDEE EMAIL VERIFICATION FLOW")
    print("=" * 70)

    # Clean up test user if exists
    test_email = 'test_attendee_email@example.com'
    Attendee.objects.filter(email=test_email).delete()

    # 1. Create attendee (simulates registration)
    print("\n1. Creating test attendee...")
    attendee = Attendee.objects.create_user(
        email=test_email,
        password='TestPass123!',
        first_name='Test',
        last_name='Attendee',
        phone_number='254712345678'
    )
    print(f"   ✓ Attendee created: {attendee.email}")
    print(f"   ✓ Email verified: {attendee.email_verified}")

    # 2. Generate verification token
    print("\n2. Generating verification token...")
    verification_token = generate_verification_token(attendee)
    print(f"   ✓ Token generated: {verification_token.token[:20]}...")
    print(f"   ✓ Expires at: {verification_token.expires_at}")
    print(f"   ✓ Associated with: Attendee {attendee.email}")

    # 3. Send verification email
    print("\n3. Sending verification email...")
    result = EmailService.send_verification_email(attendee, verification_token)
    if result:
        print(f"   ✓ Verification email sent successfully!")
        print(f"   ✓ Check Maildev at http://localhost:1080")
    else:
        print(f"   ✗ Failed to send verification email")
        return

    # 4. Verify the token
    print("\n4. Verifying email with token...")
    success, message, user_instance = verify_token(verification_token.token)

    if success:
        print(f"   ✓ {message}")
        print(f"   ✓ User type: {type(user_instance).__name__}")
        print(f"   ✓ Email: {user_instance.email}")
        print(f"   ✓ Email verified: {user_instance.email_verified}")
    else:
        print(f"   ✗ Verification failed: {message}")
        return

    # 5. Check welcome email was sent
    print("\n5. Welcome email should have been sent automatically")
    print(f"   ✓ Check Maildev for welcome email")

    # 6. Verify database state
    print("\n6. Checking database state...")
    attendee.refresh_from_db()
    print(f"   ✓ Attendee email_verified: {attendee.email_verified}")

    verification_token.refresh_from_db()
    print(f"   ✓ Token used: {verification_token.used}")
    print(f"   ✓ Token is_valid: {verification_token.is_valid}")

    print("\n" + "=" * 70)
    print("TEST COMPLETE!")
    print("=" * 70)
    print("\nNext steps:")
    print("1. Open Maildev at http://localhost:1080")
    print("2. You should see 2 emails:")
    print("   - Verification email (sent on registration)")
    print("   - Welcome email (sent after verification)")
    print("\nBoth emails should be properly formatted for attendees.")
    print("=" * 70 + "\n")

    # Cleanup
    print("Cleaning up test data...")
    attendee.delete()
    print("✓ Test attendee removed\n")


def compare_organizer_vs_attendee():
    """Compare email sending for organizer vs attendee"""
    print("\n" + "=" * 70)
    print("COMPARING ORGANIZER VS ATTENDEE EMAIL TEMPLATES")
    print("=" * 70)

    from apps.users.models import User

    # Clean up test users
    User.objects.filter(email='test_organizer_compare@example.com').delete()
    Attendee.objects.filter(email='test_attendee_compare@example.com').delete()

    # Create organizer
    print("\n1. Creating test organizer...")
    organizer = User.objects.create_user(
        email='test_organizer_compare@example.com',
        password='TestPass123!',
        company_name='Test Company',
        phone_number='254712345678'
    )
    print(f"   ✓ Organizer created: {organizer.email}")

    # Create attendee
    print("\n2. Creating test attendee...")
    attendee = Attendee.objects.create_user(
        email='test_attendee_compare@example.com',
        password='TestPass123!',
        first_name='Test',
        last_name='Attendee',
        phone_number='254712345678'
    )
    print(f"   ✓ Attendee created: {attendee.email}")

    # Send verification emails for both
    print("\n3. Sending verification emails...")
    org_token = generate_verification_token(organizer)
    att_token = generate_verification_token(attendee)

    EmailService.send_verification_email(organizer, org_token)
    print(f"   ✓ Organizer verification email sent")

    EmailService.send_verification_email(attendee, att_token)
    print(f"   ✓ Attendee verification email sent")

    print("\n4. Check Maildev at http://localhost:1080")
    print("   You should see 2 verification emails:")
    print("   - One for organizer (test_organizer_compare@example.com)")
    print("   - One for attendee (test_attendee_compare@example.com)")
    print("\n   Compare them to ensure they're properly formatted!")

    # Cleanup
    print("\n5. Cleaning up test data...")
    organizer.delete()
    attendee.delete()
    print("   ✓ Test users removed")

    print("\n" + "=" * 70 + "\n")


if __name__ == '__main__':
    import sys

    print("\nATTENDEE EMAIL VERIFICATION TEST SUITE")
    print("=" * 70)
    print("\nMake sure:")
    print("1. Django server is running (python manage.py runserver)")
    print("2. Maildev is running at http://localhost:1080")
    print("3. You have email templates in backend/templates/emails/")
    print("=" * 70)

    choice = input("\nChoose test:\n1. Full attendee email flow\n2. Compare organizer vs attendee emails\n3. Both\n\nEnter choice (1/2/3): ").strip()

    if choice == '1':
        test_attendee_email_flow()
    elif choice == '2':
        compare_organizer_vs_attendee()
    elif choice == '3':
        test_attendee_email_flow()
        compare_organizer_vs_attendee()
    else:
        print("Invalid choice. Exiting.")
