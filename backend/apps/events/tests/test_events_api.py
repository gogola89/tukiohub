"""
Tests for Sprint 5 Events API
"""

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from rest_framework import status
from apps.events.models import Event, TicketType, PromoCode

User = get_user_model()


@pytest.fixture
def api_client():
    """Create API client"""
    return APIClient()


@pytest.fixture
def verified_organizer():
    """Create verified organizer user"""
    return User.objects.create_user(
        email='organizer@tukiohub.com',
        password='organizer123',
        phone_number='+254700000001',
        company_name='Test Events Co',
        role=User.ORGANIZER,
        verification_status=User.APPROVED,
        email_verified=True
    )


@pytest.fixture
def authenticated_organizer(api_client, verified_organizer):
    """Create authenticated organizer client"""
    api_client.force_authenticate(user=verified_organizer)
    return api_client


@pytest.fixture
def sample_event(verified_organizer):
    """Create a sample event"""
    start_datetime = timezone.now() + timedelta(days=30)
    end_datetime = start_datetime + timedelta(hours=4)

    return Event.objects.create(
        organizer=verified_organizer,
        title='Test Music Concert',
        description='A great music event',
        category=Event.MUSIC,
        venue_name='Uhuru Park',
        venue_address='Nairobi, Kenya',
        start_datetime=start_datetime,
        end_datetime=end_datetime,
        capacity=1000,
        is_free=False,
        status=Event.DRAFT
    )


@pytest.fixture
def sample_ticket_type(sample_event):
    """Create a sample ticket type"""
    return TicketType.objects.create(
        event=sample_event,
        name=TicketType.REGULAR,
        description='Regular admission',
        price=1000.00,
        quantity_available=500,
        sales_start_date=timezone.now(),
        sales_end_date=sample_event.start_datetime
    )


@pytest.mark.django_db
class TestEventCreation:
    """Test event creation"""

    def test_organizer_can_create_event(self, authenticated_organizer):
        """Test verified organizer can create event"""
        start_datetime = (timezone.now() + timedelta(days=30)).isoformat()
        end_datetime = (timezone.now() + timedelta(days=30, hours=4)).isoformat()

        data = {
            'title': 'New Music Festival',
            'description': 'Amazing music festival',
            'category': 'MUSIC',
            'venue_name': 'KICC',
            'venue_address': 'Nairobi CBD',
            'start_datetime': start_datetime,
            'end_datetime': end_datetime,
            'capacity': 5000,
            'is_free': False
        }

        response = authenticated_organizer.post('/api/events/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['title'] == 'New Music Festival'
        assert response.data['status'] == 'DRAFT'
        assert 'slug' in response.data

    def test_unauthenticated_cannot_create_event(self, api_client):
        """Test unauthenticated user cannot create event"""
        data = {'title': 'Test Event'}
        response = api_client.post('/api/events/', data, format='json')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestEventListing:
    """Test event listing"""

    def test_organizer_can_list_own_events(self, authenticated_organizer, sample_event):
        """Test organizer can list their own events"""
        response = authenticated_organizer.get('/api/events/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_public_can_list_published_events(self, api_client, sample_event, sample_ticket_type):
        """Test public can browse published events"""
        # Publish the event
        sample_event.status = Event.PUBLISHED
        sample_event.save()

        response = api_client.get('/api/public/events/')

        assert response.status_code == status.HTTP_200_OK
        # Event should be in the list
        assert len(response.data['results']) >= 1


@pytest.mark.django_db
class TestEventPublishing:
    """Test event publishing"""

    def test_organizer_can_publish_event_with_ticket_types(
        self, authenticated_organizer, sample_event, sample_ticket_type
    ):
        """Test organizer can publish event when it has ticket types"""
        # Add featured image (simulate)
        sample_event.featured_image = 'events/test.jpg'
        sample_event.save()

        response = authenticated_organizer.post(
            f'/api/events/{sample_event.id}/publish/',
            format='json'
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['message'] == 'Event published successfully.'

        # Verify event status changed
        sample_event.refresh_from_db()
        assert sample_event.status == Event.PUBLISHED

    def test_cannot_publish_event_without_ticket_types(self, authenticated_organizer, sample_event):
        """Test cannot publish event without ticket types"""
        sample_event.featured_image = 'events/test.jpg'
        sample_event.save()

        response = authenticated_organizer.post(
            f'/api/events/{sample_event.id}/publish/',
            format='json'
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestTicketTypes:
    """Test ticket type management"""

    def test_organizer_can_create_ticket_type(self, authenticated_organizer, sample_event):
        """Test organizer can create ticket type for their event"""
        data = {
            'name': 'VIP',
            'description': 'VIP access',
            'price': '5000.00',
            'quantity_available': 100,
            'sales_start_date': timezone.now().isoformat(),
            'sales_end_date': sample_event.start_datetime.isoformat()
        }

        response = authenticated_organizer.post(
            f'/api/events/{sample_event.id}/tickets/',
            data,
            format='json'
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'VIP'
        assert float(response.data['price']) == 5000.00

    def test_organizer_can_list_ticket_types(
        self, authenticated_organizer, sample_event, sample_ticket_type
    ):
        """Test organizer can list ticket types for their event"""
        response = authenticated_organizer.get(f'/api/events/{sample_event.id}/tickets/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1


@pytest.mark.django_db
class TestPromoCode:
    """Test promo code management"""

    def test_organizer_can_create_promo_code(self, authenticated_organizer, sample_event):
        """Test organizer can create promo code"""
        valid_from = timezone.now()
        valid_until = valid_from + timedelta(days=7)

        data = {
            'code': 'EARLYBIRD',
            'discount_type': 'PERCENTAGE',
            'discount_value': '20.00',
            'usage_limit': 100,
            'valid_from': valid_from.isoformat(),
            'valid_until': valid_until.isoformat(),
            'is_active': True
        }

        response = authenticated_organizer.post(
            f'/api/events/{sample_event.id}/promo-codes/',
            data,
            format='json'
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['code'] == 'EARLYBIRD'
        assert response.data['discount_type'] == 'PERCENTAGE'


@pytest.mark.django_db
class TestEventSearch:
    """Test event search and filtering"""

    def test_public_can_search_events(self, api_client, sample_event, sample_ticket_type):
        """Test public can search events"""
        # Publish the event
        sample_event.status = Event.PUBLISHED
        sample_event.featured_image = 'events/test.jpg'
        sample_event.save()

        response = api_client.get('/api/public/events/search/?q=Music')

        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data

    def test_can_get_event_categories(self, api_client):
        """Test can get event categories"""
        response = api_client.get('/api/public/events/categories/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) > 0
        assert any(cat['value'] == 'MUSIC' for cat in response.data)


@pytest.mark.django_db
class TestEventPermissions:
    """Test event permissions"""

    def test_organizer_cannot_update_other_organizer_event(
        self, api_client, sample_event, verified_organizer
    ):
        """Test organizer cannot update another organizer's event"""
        # Create another organizer
        other_organizer = User.objects.create_user(
            email='other@tukiohub.com',
            password='other123',
            phone_number='+254700000002',
            company_name='Other Events Co',
            role=User.ORGANIZER,
            verification_status=User.APPROVED
        )

        api_client.force_authenticate(user=other_organizer)

        data = {'title': 'Hacked Title'}
        response = api_client.patch(
            f'/api/events/{sample_event.id}/',
            data,
            format='json'
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_regular_user_cannot_create_event(self, api_client):
        """Test regular user cannot create events"""
        regular_user = User.objects.create_user(
            email='regular@tukiohub.com',
            password='regular123',
            phone_number='+254700000003'
        )

        api_client.force_authenticate(user=regular_user)

        start_datetime = (timezone.now() + timedelta(days=30)).isoformat()
        end_datetime = (timezone.now() + timedelta(days=30, hours=4)).isoformat()

        data = {
            'title': 'Unauthorized Event',
            'description': 'Should not be created',
            'category': 'MUSIC',
            'venue_name': 'Test Venue',
            'venue_address': 'Test Address',
            'start_datetime': start_datetime,
            'end_datetime': end_datetime,
            'capacity': 1000
        }

        response = api_client.post('/api/events/', data, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN
