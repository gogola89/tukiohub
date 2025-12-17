"""
Public views for event discovery
"""

from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from django.db.models import Q

from .models import Event
from .serializers import EventListSerializer, EventDetailSerializer
from .filters import EventFilter
from .services import (
    get_featured_events,
    get_event_categories,
    search_events,
    get_nearby_events,
    cache_event_data
)


class PublicEventViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public ViewSet for browsing events

    list: GET /api/public/events/ - List all published events
    retrieve: GET /api/public/events/<slug>/ - Get event details by slug
    """

    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = EventFilter
    search_fields = ['title', 'description', 'venue_name', 'venue_address']
    ordering_fields = ['start_datetime', 'created_at', 'title']
    ordering = ['start_datetime']
    lookup_field = 'slug'

    def get_queryset(self):
        """Get only published upcoming events"""
        return Event.objects.filter(
            status=Event.PUBLISHED,
            start_datetime__gte=timezone.now()
        ).select_related('organizer').prefetch_related(
            'ticket_types',
            'event_images'
        )

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return EventListSerializer
        return EventDetailSerializer

    def retrieve(self, request, slug=None):
        """
        Get event details by slug

        Try to get from cache first, then from database.
        """
        event = self.get_object()

        # Try to get cached data
        cached_data = cache_event_data(event.id)

        if cached_data:
            # If cached, still return full serializer data
            # (cache is just for performance, not replacement)
            pass

        serializer = self.get_serializer(event)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """
        Get upcoming events (next 30 days)

        GET /api/public/events/upcoming/
        """
        from datetime import timedelta

        end_date = timezone.now() + timedelta(days=30)

        events = self.get_queryset().filter(
            start_datetime__lte=end_date
        )[:20]

        serializer = EventListSerializer(
            events,
            many=True,
            context={'request': request}
        )

        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def this_weekend(self, request):
        """
        Get events happening this weekend

        GET /api/public/events/this-weekend/
        """
        from datetime import timedelta

        today = timezone.now().date()
        # Find next Saturday
        days_until_saturday = (5 - today.weekday()) % 7
        if days_until_saturday == 0:
            days_until_saturday = 7

        saturday = today + timedelta(days=days_until_saturday)
        sunday = saturday + timedelta(days=1)

        events = self.get_queryset().filter(
            start_datetime__date__gte=saturday,
            start_datetime__date__lte=sunday
        )

        serializer = EventListSerializer(
            events,
            many=True,
            context={'request': request}
        )

        return Response(serializer.data)


class FeaturedEventsAPIView(generics.ListAPIView):
    """
    Get featured events

    GET /api/public/events/featured/
    """

    serializer_class = EventListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        """Get featured events"""
        limit = int(self.request.query_params.get('limit', 6))
        return get_featured_events(limit=limit)


class EventCategoriesAPIView(generics.GenericAPIView):
    """
    Get all event categories

    GET /api/public/events/categories/
    """

    permission_classes = [AllowAny]

    def get(self, request):
        """Return list of event categories"""
        categories = get_event_categories()
        return Response(categories, status=status.HTTP_200_OK)


class EventSearchAPIView(generics.GenericAPIView):
    """
    Search events with full-text search

    GET /api/public/events/search/?q=<query>&category=<category>&is_free=<bool>
    """

    permission_classes = [AllowAny]
    serializer_class = EventListSerializer

    def get(self, request):
        """
        Search events

        Query parameters:
        - q: Search query (searches in title, description, venue)
        - category: Filter by category
        - is_free: Filter free events (true/false)
        - start_date: Filter by start date (ISO format)
        - end_date: Filter by end date (ISO format)
        - limit: Number of results (default 20)
        """
        query = request.query_params.get('q', '')
        category = request.query_params.get('category')
        is_free = request.query_params.get('is_free')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        limit = int(request.query_params.get('limit', 20))

        # Build filters
        filters = {}
        if category:
            filters['category'] = category
        if is_free is not None:
            filters['is_free'] = is_free.lower() == 'true'
        if start_date:
            try:
                filters['start_date'] = timezone.datetime.fromisoformat(start_date)
            except ValueError:
                pass
        if end_date:
            try:
                filters['end_date'] = timezone.datetime.fromisoformat(end_date)
            except ValueError:
                pass

        # Search events
        events = search_events(query, filters)[:limit]

        serializer = self.serializer_class(
            events,
            many=True,
            context={'request': request}
        )

        return Response({
            'query': query,
            'count': len(events),
            'results': serializer.data
        }, status=status.HTTP_200_OK)


class NearbyEventsAPIView(generics.GenericAPIView):
    """
    Get events near a location

    GET /api/public/events/nearby/?lat=<latitude>&lon=<longitude>&radius=<km>
    """

    permission_classes = [AllowAny]
    serializer_class = EventListSerializer

    def get(self, request):
        """
        Get nearby events

        Query parameters:
        - lat: Latitude (required)
        - lon: Longitude (required)
        - radius: Search radius in kilometers (default 50)
        - limit: Number of results (default 10)
        """
        latitude = request.query_params.get('lat')
        longitude = request.query_params.get('lon')

        if not latitude or not longitude:
            return Response(
                {'error': 'Both latitude and longitude are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            latitude = float(latitude)
            longitude = float(longitude)
        except ValueError:
            return Response(
                {'error': 'Invalid latitude or longitude format.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        radius = int(request.query_params.get('radius', 50))
        limit = int(request.query_params.get('limit', 10))

        # Get nearby events
        events = get_nearby_events(latitude, longitude, radius, limit)

        serializer = self.serializer_class(
            events,
            many=True,
            context={'request': request}
        )

        return Response({
            'location': {
                'latitude': latitude,
                'longitude': longitude,
                'radius_km': radius
            },
            'count': len(events),
            'results': serializer.data
        }, status=status.HTTP_200_OK)


class EventsByCategoryAPIView(generics.ListAPIView):
    """
    Get events by category

    GET /api/public/events/category/<category>/
    """

    serializer_class = EventListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        """Get events for the specified category"""
        category = self.kwargs.get('category')

        return Event.objects.filter(
            status=Event.PUBLISHED,
            start_datetime__gte=timezone.now(),
            category=category.upper()
        ).select_related('organizer').prefetch_related('ticket_types')
