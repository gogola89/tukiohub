"""
Tests for Sprint 3 API endpoints
"""

import pytest
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core import mail
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import EmailVerification
from apps.users.services import generate_verification_token
from io import BytesIO
from PIL import Image

User = get_user_model()


@pytest.fixture
def api_client():
    """Create API client"""
    return APIClient()


@pytest.fixture
def test_user():
    """Create test user"""
    return User.objects.create_user(
        email='testuser@example.com',
        password='testpass123',
        phone_number='+254712345678',
        company_name='Test Company'
    )


@pytest.fixture
def authenticated_client(api_client, test_user):
    """Create authenticated API client"""
    api_client.force_authenticate(user=test_user)
    return api_client


@pytest.mark.django_db
class TestRegistrationAPI:
    """Test user registration endpoint"""

    def test_register_organizer_success(self, api_client):
        """Test successful organizer registration"""
        data = {
            'email': 'neworganizer@example.com',
            'password': 'SecurePass123!',
            'password2': 'SecurePass123!',
            'company_name': 'New Company',
            'phone_number': '+254711111111'
        }

        response = api_client.post('/api/auth/register/', data)

        assert response.status_code == status.HTTP_201_CREATED
        assert 'user' in response.data
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert response.data['user']['email'] == data['email']
        assert response.data['user']['role'] == 'ORGANIZER'

        # Check verification email was sent
        assert len(mail.outbox) == 1
        assert 'verify' in mail.outbox[0].subject.lower()

    def test_register_password_mismatch(self, api_client):
        """Test registration with mismatched passwords"""
        data = {
            'email': 'neworganizer@example.com',
            'password': 'SecurePass123!',
            'password2': 'DifferentPass123!',
            'company_name': 'New Company',
            'phone_number': '+254711111111'
        }

        response = api_client.post('/api/auth/register/', data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_duplicate_email(self, api_client, test_user):
        """Test registration with existing email"""
        data = {
            'email': test_user.email,
            'password': 'SecurePass123!',
            'password2': 'SecurePass123!',
            'company_name': 'New Company',
            'phone_number': '+254711111111'
        }

        response = api_client.post('/api/auth/register/', data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestEmailVerificationAPI:
    """Test email verification endpoint"""

    def test_verify_email_success(self, api_client, test_user):
        """Test successful email verification"""
        verification = generate_verification_token(test_user)

        data = {'token': verification.token}
        response = api_client.post('/api/auth/verify-email/', data)

        assert response.status_code == status.HTTP_200_OK
        assert 'success' in response.data['message'].lower()
        assert 'user' in response.data

        # Check user is verified
        test_user.refresh_from_db()
        assert test_user.email_verified is True

        # Check welcome email was sent
        assert len(mail.outbox) == 1
        assert 'welcome' in mail.outbox[0].subject.lower()

    def test_verify_email_invalid_token(self, api_client):
        """Test email verification with invalid token"""
        data = {'token': 'invalid_token'}
        response = api_client.post('/api/auth/verify-email/', data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_verify_email_already_used(self, api_client, test_user):
        """Test email verification with already used token"""
        verification = generate_verification_token(test_user)

        # Use token once
        data = {'token': verification.token}
        api_client.post('/api/auth/verify-email/', data)

        # Try to use again
        response = api_client.post('/api/auth/verify-email/', data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'used' in response.data['message'].lower()


@pytest.mark.django_db
class TestProfileImageUploadAPI:
    """Test profile image upload endpoint"""

    def test_upload_logo_success(self, authenticated_client, test_user):
        """Test successful logo upload"""
        # Create test image
        image = Image.new('RGB', (100, 100), color='red')
        image_file = BytesIO()
        image.save(image_file, 'PNG')
        image_file.seek(0)

        uploaded_file = SimpleUploadedFile(
            'test_logo.png',
            image_file.read(),
            content_type='image/png'
        )

        data = {'logo': uploaded_file}
        response = authenticated_client.put('/api/auth/upload-logo/', data, format='multipart')

        assert response.status_code == status.HTTP_200_OK
        assert 'message' in response.data
        assert 'uploaded successfully' in response.data['message'].lower()

        # Check logo was saved
        test_user.refresh_from_db()
        assert test_user.logo is not None

    def test_upload_logo_unauthenticated(self, api_client):
        """Test logo upload without authentication"""
        image = Image.new('RGB', (100, 100), color='red')
        image_file = BytesIO()
        image.save(image_file, 'PNG')
        image_file.seek(0)

        uploaded_file = SimpleUploadedFile(
            'test_logo.png',
            image_file.read(),
            content_type='image/png'
        )

        data = {'logo': uploaded_file}
        response = api_client.put('/api/auth/upload-logo/', data, format='multipart')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestDocumentUploadAPI:
    """Test document upload endpoint"""

    def test_upload_document_success(self, authenticated_client, test_user):
        """Test successful document upload"""
        # Create test PDF content
        document = SimpleUploadedFile(
            'business_reg.pdf',
            b'PDF content here',
            content_type='application/pdf'
        )

        data = {
            'document': document,
            'document_type': 'business_registration'
        }
        response = authenticated_client.post('/api/auth/upload-document/', data, format='multipart')

        assert response.status_code == status.HTTP_201_CREATED
        assert 'message' in response.data
        assert 'uploaded successfully' in response.data['message'].lower()

        # Check document was saved
        test_user.refresh_from_db()
        assert len(test_user.verification_documents) == 1
        assert test_user.verification_documents[0]['type'] == 'business_registration'

    def test_upload_document_too_large(self, authenticated_client):
        """Test uploading document that exceeds size limit"""
        # Create file larger than 5MB
        large_content = b'x' * (6 * 1024 * 1024)  # 6MB
        document = SimpleUploadedFile(
            'large_file.pdf',
            large_content,
            content_type='application/pdf'
        )

        data = {
            'document': document,
            'document_type': 'business_registration'
        }
        response = authenticated_client.post('/api/auth/upload-document/', data, format='multipart')

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_upload_document_invalid_type(self, authenticated_client):
        """Test uploading document with invalid file type"""
        document = SimpleUploadedFile(
            'script.exe',
            b'executable content',
            content_type='application/exe'
        )

        data = {
            'document': document,
            'document_type': 'business_registration'
        }
        response = authenticated_client.post('/api/auth/upload-document/', data, format='multipart')

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_upload_document_unauthenticated(self, api_client):
        """Test document upload without authentication"""
        document = SimpleUploadedFile(
            'test.pdf',
            b'PDF content',
            content_type='application/pdf'
        )

        data = {
            'document': document,
            'document_type': 'business_registration'
        }
        response = api_client.post('/api/auth/upload-document/', data, format='multipart')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestOrganizerDashboardAPI:
    """Test organizer dashboard endpoint"""

    def test_dashboard_authenticated(self, authenticated_client, test_user):
        """Test accessing dashboard with authentication"""
        response = authenticated_client.get('/api/organizer/dashboard/')

        assert response.status_code == status.HTTP_200_OK
        assert 'user' in response.data
        assert 'stats' in response.data
        assert 'verification_status' in response.data
        assert 'email_verified' in response.data
        assert 'profile_complete' in response.data

        # Check stats structure
        assert 'total_events' in response.data['stats']
        assert 'active_events' in response.data['stats']
        assert 'total_tickets_sold' in response.data['stats']
        assert 'total_revenue' in response.data['stats']

    def test_dashboard_unauthenticated(self, api_client):
        """Test accessing dashboard without authentication"""
        response = api_client.get('/api/organizer/dashboard/')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_dashboard_profile_complete_status(self, authenticated_client, test_user):
        """Test dashboard shows correct profile completion status"""
        # Initially incomplete (no logo)
        response = authenticated_client.get('/api/organizer/dashboard/')
        assert response.data['profile_complete'] is False

        # Add logo
        test_user.logo = 'logos/test.png'
        test_user.save()

        # Now complete
        response = authenticated_client.get('/api/organizer/dashboard/')
        assert response.data['profile_complete'] is True


@pytest.mark.django_db
class TestProfileUpdateAPI:
    """Test profile update endpoint"""

    def test_update_profile_success(self, authenticated_client, test_user):
        """Test successful profile update"""
        data = {
            'company_name': 'Updated Company Name',
            'phone_number': '+254799999999'
        }

        response = authenticated_client.patch('/api/auth/me/', data)

        assert response.status_code == status.HTTP_200_OK

        # Check user was updated
        test_user.refresh_from_db()
        assert test_user.company_name == 'Updated Company Name'
        assert test_user.phone_number == '+254799999999'

    def test_cannot_update_email(self, authenticated_client, test_user):
        """Test that email cannot be updated directly"""
        original_email = test_user.email
        data = {'email': 'newemail@example.com'}

        response = authenticated_client.patch('/api/auth/me/', data)

        # Email should not change (it's read-only)
        test_user.refresh_from_db()
        assert test_user.email == original_email

    def test_cannot_update_verification_status(self, authenticated_client, test_user):
        """Test that verification status cannot be updated by user"""
        data = {'verification_status': 'APPROVED'}

        response = authenticated_client.patch('/api/auth/me/', data)

        # Verification status should not change (it's read-only)
        test_user.refresh_from_db()
        assert test_user.verification_status == 'PENDING'

    def test_update_profile_unauthenticated(self, api_client):
        """Test profile update without authentication"""
        data = {'company_name': 'New Name'}
        response = api_client.patch('/api/auth/me/', data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
