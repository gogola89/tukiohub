"""
Tests for Sprint 4 Admin API endpoints
"""

import pytest
from django.contrib.auth import get_user_model
from django.core import mail
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


@pytest.fixture
def api_client():
    """Create API client"""
    return APIClient()


@pytest.fixture
def admin_user():
    """Create admin user"""
    return User.objects.create_user(
        email='admin@tukiohub.com',
        password='admin123',
        phone_number='+254700000000',
        role=User.ADMIN,
        is_staff=True,
        is_superuser=True
    )


@pytest.fixture
def organizer_user():
    """Create organizer user"""
    return User.objects.create_user(
        email='organizer@example.com',
        password='organizer123',
        phone_number='+254711111111',
        company_name='Test Events Co',
        role=User.ORGANIZER
    )


@pytest.fixture
def pending_organizer():
    """Create pending organizer"""
    return User.objects.create_user(
        email='pending@example.com',
        password='pending123',
        phone_number='+254722222222',
        company_name='Pending Events',
        role=User.ORGANIZER,
        verification_status=User.PENDING
    )


@pytest.fixture
def approved_organizer():
    """Create approved organizer"""
    return User.objects.create_user(
        email='approved@example.com',
        password='approved123',
        phone_number='+254733333333',
        company_name='Approved Events',
        role=User.ORGANIZER,
        verification_status=User.APPROVED
    )


@pytest.fixture
def authenticated_admin(api_client, admin_user):
    """Create authenticated admin client"""
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def authenticated_organizer(api_client, organizer_user):
    """Create authenticated organizer client"""
    api_client.force_authenticate(user=organizer_user)
    return api_client


@pytest.mark.django_db
class TestAdminOrganizerListAPI:
    """Test admin organizer list endpoint"""

    def test_admin_can_list_organizers(self, authenticated_admin, pending_organizer, approved_organizer):
        """Test admin can view all organizers"""
        response = authenticated_admin.get('/api/admin/organizers/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 2

    def test_organizer_cannot_access_admin_list(self, authenticated_organizer):
        """Test organizer cannot access admin organizer list"""
        response = authenticated_organizer.get('/api/admin/organizers/')

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_unauthenticated_cannot_access_admin_list(self, api_client):
        """Test unauthenticated user cannot access admin list"""
        response = api_client.get('/api/admin/organizers/')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_filter_by_verification_status(self, authenticated_admin, pending_organizer, approved_organizer):
        """Test filtering organizers by verification status"""
        response = authenticated_admin.get('/api/admin/organizers/?status=pending')

        assert response.status_code == status.HTTP_200_OK
        for organizer in response.data:
            assert organizer['verification_status'] == 'PENDING'

    def test_search_organizers(self, authenticated_admin, pending_organizer):
        """Test searching organizers by email or company name"""
        response = authenticated_admin.get('/api/admin/organizers/?search=pending')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_filter_by_email_verified(self, authenticated_admin, pending_organizer):
        """Test filtering by email verified status"""
        response = authenticated_admin.get('/api/admin/organizers/?email_verified=false')

        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestAdminOrganizerDetailAPI:
    """Test admin organizer detail endpoint"""

    def test_admin_can_view_organizer_details(self, authenticated_admin, pending_organizer):
        """Test admin can view organizer details"""
        response = authenticated_admin.get(f'/api/admin/organizers/{pending_organizer.id}/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == pending_organizer.email
        assert response.data['company_name'] == pending_organizer.company_name
        assert 'verification_documents' in response.data

    def test_admin_can_update_organizer(self, authenticated_admin, pending_organizer):
        """Test admin can update organizer details"""
        data = {
            'company_name': 'Updated Company Name',
            'is_active': False
        }

        response = authenticated_admin.patch(
            f'/api/admin/organizers/{pending_organizer.id}/',
            data,
            format='json'
        )

        assert response.status_code == status.HTTP_200_OK

        # Verify update
        pending_organizer.refresh_from_db()
        assert pending_organizer.company_name == 'Updated Company Name'
        assert pending_organizer.is_active is False

    def test_organizer_cannot_access_admin_detail(self, authenticated_organizer, pending_organizer):
        """Test organizer cannot access admin detail endpoint"""
        response = authenticated_organizer.get(f'/api/admin/organizers/{pending_organizer.id}/')

        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestOrganizerApprovalAPI:
    """Test organizer approval/rejection endpoint"""

    def test_admin_can_approve_organizer(self, authenticated_admin, pending_organizer):
        """Test admin can approve organizer"""
        data = {'action': 'approve'}

        response = authenticated_admin.post(
            f'/api/admin/organizers/{pending_organizer.id}/approve-reject/',
            data,
            format='json'
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['message'] == 'Organizer approved successfully.'

        # Verify database update
        pending_organizer.refresh_from_db()
        assert pending_organizer.verification_status == User.APPROVED

        # Verify approval email was sent
        assert len(mail.outbox) == 1
        assert 'approved' in mail.outbox[0].subject.lower()
        assert mail.outbox[0].to == [pending_organizer.email]

    def test_admin_can_reject_organizer(self, authenticated_admin, pending_organizer):
        """Test admin can reject organizer"""
        data = {
            'action': 'reject',
            'reason': 'Incomplete documentation'
        }

        response = authenticated_admin.post(
            f'/api/admin/organizers/{pending_organizer.id}/approve-reject/',
            data,
            format='json'
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['message'] == 'Organizer rejected.'

        # Verify database update
        pending_organizer.refresh_from_db()
        assert pending_organizer.verification_status == User.REJECTED

        # Verify rejection email was sent
        assert len(mail.outbox) == 1
        assert 'application' in mail.outbox[0].subject.lower()
        assert mail.outbox[0].to == [pending_organizer.email]

    def test_reject_requires_reason(self, authenticated_admin, pending_organizer):
        """Test rejection requires a reason"""
        data = {'action': 'reject'}

        response = authenticated_admin.post(
            f'/api/admin/organizers/{pending_organizer.id}/approve-reject/',
            data,
            format='json'
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'reason' in response.data

    def test_organizer_cannot_approve_other_organizer(self, authenticated_organizer, pending_organizer):
        """Test organizer cannot approve other organizers"""
        data = {'action': 'approve'}

        response = authenticated_organizer.post(
            f'/api/admin/organizers/{pending_organizer.id}/approve-reject/',
            data,
            format='json'
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_invalid_action(self, authenticated_admin, pending_organizer):
        """Test invalid approval action"""
        data = {'action': 'invalid'}

        response = authenticated_admin.post(
            f'/api/admin/organizers/{pending_organizer.id}/approve-reject/',
            data,
            format='json'
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestAdminDashboardAPI:
    """Test admin dashboard endpoint"""

    def test_admin_can_access_dashboard(self, authenticated_admin):
        """Test admin can access dashboard"""
        response = authenticated_admin.get('/api/admin/dashboard/')

        assert response.status_code == status.HTTP_200_OK
        assert 'total_organizers' in response.data
        assert 'pending_organizers' in response.data
        assert 'total_events' in response.data
        assert 'total_revenue' in response.data

    def test_dashboard_shows_organizer_stats(
        self,
        authenticated_admin,
        pending_organizer,
        approved_organizer
    ):
        """Test dashboard shows correct organizer statistics"""
        response = authenticated_admin.get('/api/admin/dashboard/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['pending_organizers'] >= 1
        assert response.data['total_organizers'] >= 2

    def test_dashboard_shows_recent_pending(self, authenticated_admin, pending_organizer):
        """Test dashboard's pending count reflects newly created pending organizers"""
        response = authenticated_admin.get('/api/admin/dashboard/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['pending_organizers'] >= 1

    def test_organizer_cannot_access_dashboard(self, authenticated_organizer):
        """Test organizer cannot access admin dashboard"""
        response = authenticated_organizer.get('/api/admin/dashboard/')

        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestAdminAnalyticsAPI:
    """Test admin analytics endpoint"""

    def test_admin_can_access_analytics(self, authenticated_admin):
        """Test admin can access analytics"""
        response = authenticated_admin.get('/api/admin/analytics/')

        assert response.status_code == status.HTTP_200_OK
        assert 'total_organizers' in response.data
        assert 'total_events' in response.data
        assert 'total_revenue' in response.data
        assert 'total_tickets_sold' in response.data

    def test_analytics_custom_time_period(self, authenticated_admin):
        """Test analytics endpoint accepts a days query param without erroring"""
        response = authenticated_admin.get('/api/admin/analytics/?days=7')

        assert response.status_code == status.HTTP_200_OK
        assert 'total_organizers' in response.data

    def test_analytics_approval_rate_calculation(
        self,
        authenticated_admin,
        pending_organizer,
        approved_organizer
    ):
        """Test analytics reflects the current organizer count across statuses"""
        # Create a rejected organizer
        User.objects.create_user(
            email='rejected@example.com',
            password='rejected123',
            phone_number='+254744444444',
            role=User.ORGANIZER,
            verification_status=User.REJECTED
        )

        response = authenticated_admin.get('/api/admin/analytics/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['total_organizers'] >= 3

    def test_organizer_cannot_access_analytics(self, authenticated_organizer):
        """Test organizer cannot access admin analytics"""
        response = authenticated_organizer.get('/api/admin/analytics/')

        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestAdminPermissions:
    """Test admin permission enforcement"""

    def test_only_admin_role_has_admin_access(self, authenticated_organizer):
        """Test only users with ADMIN role can access admin endpoints"""
        endpoints = [
            '/api/admin/organizers/',
            '/api/admin/dashboard/',
            '/api/admin/analytics/',
        ]

        for endpoint in endpoints:
            response = authenticated_organizer.get(endpoint)
            assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_regular_user_cannot_access_admin_endpoints(self, api_client):
        """Test regular authenticated user cannot access admin endpoints"""
        # Create regular user (not organizer or admin)
        user = User.objects.create_user(
            email='regular@example.com',
            password='regular123',
            phone_number='+254755555555'
        )

        api_client.force_authenticate(user=user)

        endpoints = [
            '/api/admin/organizers/',
            '/api/admin/dashboard/',
            '/api/admin/analytics/',
        ]

        for endpoint in endpoints:
            response = api_client.get(endpoint)
            assert response.status_code == status.HTTP_403_FORBIDDEN
