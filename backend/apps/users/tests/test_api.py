"""
Tests for User API endpoints
"""

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture
def api_client():
    """Fixture for API client"""
    return APIClient()


@pytest.fixture
def create_user():
    """Fixture to create a user"""
    def make_user(**kwargs):
        defaults = {
            'email': 'test@example.com',
            'password': 'testpass123',
            'phone_number': '+254712345678'
        }
        defaults.update(kwargs)
        password = defaults.pop('password')
        user = User.objects.create_user(**defaults)
        user.set_password(password)
        user.save()
        return user
    return make_user


@pytest.mark.django_db
class TestUserRegistration:
    """Tests for user registration endpoint"""

    def test_register_user_success(self, api_client):
        """Test successful user registration"""
        url = reverse('users:register')
        data = {
            'email': 'newuser@example.com',
            'password': 'StrongPass123!',
            'password2': 'StrongPass123!',
            'phone_number': '+254712345678',
            'company_name': 'Test Company'
        }
        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert 'user' in response.data
        assert response.data['user']['email'] == 'newuser@example.com'

        # Verify user was created
        user = User.objects.get(email='newuser@example.com')
        assert user.company_name == 'Test Company'
        assert user.role == User.ORGANIZER

    def test_register_user_password_mismatch(self, api_client):
        """Test registration with password mismatch"""
        url = reverse('users:register')
        data = {
            'email': 'newuser@example.com',
            'password': 'StrongPass123!',
            'password2': 'DifferentPass123!',
            'phone_number': '+254712345678'
        }
        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_user_duplicate_email(self, api_client, create_user):
        """Test registration with duplicate email"""
        create_user(email='existing@example.com')

        url = reverse('users:register')
        data = {
            'email': 'existing@example.com',
            'password': 'StrongPass123!',
            'password2': 'StrongPass123!',
            'phone_number': '+254712345678'
        }
        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestUserLogin:
    """Tests for user login endpoint"""

    def test_login_success(self, api_client, create_user):
        """Test successful login"""
        user = create_user(email='test@example.com', password='testpass123')

        url = reverse('users:login')
        data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert 'user' in response.data

    def test_login_invalid_credentials(self, api_client, create_user):
        """Test login with invalid credentials"""
        create_user(email='test@example.com', password='testpass123')

        url = reverse('users:login')
        data = {
            'email': 'test@example.com',
            'password': 'wrongpassword'
        }
        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_inactive_user(self, api_client, create_user):
        """Test login with inactive user"""
        user = create_user(email='test@example.com', password='testpass123')
        user.is_active = False
        user.save()

        url = reverse('users:login')
        data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestUserProfile:
    """Tests for user profile endpoint"""

    def test_get_profile_authenticated(self, api_client, create_user):
        """Test getting profile when authenticated"""
        user = create_user(email='test@example.com', password='testpass123')
        api_client.force_authenticate(user=user)

        url = reverse('users:user-profile')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == 'test@example.com'

    def test_get_profile_unauthenticated(self, api_client):
        """Test getting profile when unauthenticated"""
        url = reverse('users:user-profile')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_update_profile(self, api_client, create_user):
        """Test updating user profile"""
        user = create_user(email='test@example.com', password='testpass123')
        api_client.force_authenticate(user=user)

        url = reverse('users:user-profile')
        data = {
            'company_name': 'Updated Company',
            'phone_number': '+254700000000'
        }
        response = api_client.patch(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['company_name'] == 'Updated Company'
        assert response.data['phone_number'] == '+254700000000'


@pytest.mark.django_db
class TestPasswordReset:
    """Tests for password reset endpoints"""

    def test_password_reset_request(self, api_client, create_user):
        """Test requesting password reset"""
        create_user(email='test@example.com', password='testpass123')

        url = reverse('users:password-reset-request')
        data = {'email': 'test@example.com'}
        response = api_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK

    def test_password_reset_request_nonexistent_email(self, api_client):
        """Test password reset with non-existent email"""
        url = reverse('users:password-reset-request')
        data = {'email': 'nonexistent@example.com'}
        response = api_client.post(url, data, format='json')

        # Should still return 200 to not reveal if email exists
        assert response.status_code == status.HTTP_200_OK
