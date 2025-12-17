"""
Views for organizer event management
"""

from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Event, TicketType, PromoCode, EventAddOn, EventImage
from .serializers import (
    EventListSerializer,
    EventDetailSerializer,
    EventCreateSerializer,
    TicketTypeSerializer,
    PromoCodeSerializer,
    EventAddOnSerializer,
    EventImageSerializer,
    EventPublishSerializer,
    ImageUploadSerializer
)
from .filters import OrganizerEventFilter
from .permissions import IsVerifiedOrganizer, IsEventOrganizer, CanManageEvent
from .services import invalidate_event_cache
import logging

logger = logging.getLogger(__name__)


class EventViewSet(viewsets.ModelViewSet):
    """
    ViewSet for organizer to manage their events

    list: GET /api/events/ - List organizer's events
    create: POST /api/events/ - Create new event
    retrieve: GET /api/events/<id>/ - Get event details
    update: PUT/PATCH /api/events/<id>/ - Update event
    destroy: DELETE /api/events/<id>/ - Delete event (soft delete)
    publish: POST /api/events/<id>/publish/ - Publish event
    upload_images: POST /api/events/<id>/images/ - Upload event images
    """

    permission_classes = [IsAuthenticated, IsVerifiedOrganizer]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = OrganizerEventFilter
    search_fields = ['title', 'description', 'venue_name']
    ordering_fields = ['start_datetime', 'created_at', 'title']
    ordering = ['-created_at']

    def get_queryset(self):
        """Get only events belonging to the authenticated organizer"""
        return Event.objects.filter(
            organizer=self.request.user
        ).select_related('organizer').prefetch_related(
            'ticket_types',
            'promo_codes',
            'addons',
            'event_images'
        )

    def get_serializer_class(self):
        """Return appropriate serializer class based on action"""
        if self.action == 'list':
            return EventListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return EventCreateSerializer
        elif self.action == 'publish':
            return EventPublishSerializer
        return EventDetailSerializer

    def get_permissions(self):
        """Get permissions based on action"""
        if self.action in ['update', 'partial_update', 'destroy', 'publish', 'upload_images']:
            return [IsAuthenticated(), IsEventOrganizer()]
        return [IsAuthenticated(), IsVerifiedOrganizer()]

    def perform_create(self, serializer):
        """Create event with organizer as current user"""
        event = serializer.save(organizer=self.request.user)
        logger.info(f"Event created: {event.title} by {self.request.user.email}")

    def perform_update(self, serializer):
        """Update event and invalidate cache"""
        event = serializer.save()
        invalidate_event_cache(event.id)
        logger.info(f"Event updated: {event.title} by {self.request.user.email}")

    def perform_destroy(self, instance):
        """Soft delete event by setting status to CANCELLED"""
        instance.status = Event.CANCELLED
        instance.save()
        invalidate_event_cache(instance.id)
        logger.info(f"Event cancelled: {instance.title} by {self.request.user.email}")

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """
        Publish an event

        Changes event status from DRAFT to PUBLISHED after validation.
        Requires featured image and at least one active ticket type.
        """
        event = self.get_object()

        # Check if already published
        if event.status == Event.PUBLISHED:
            return Response(
                {'error': 'Event is already published.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate event can be published
        serializer = EventPublishSerializer(
            data={},
            context={'event': event}
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        # Publish the event
        event.status = Event.PUBLISHED
        event.save()
        invalidate_event_cache(event.id)

        logger.info(f"Event published: {event.title} by {request.user.email}")

        return Response({
            'message': 'Event published successfully.',
            'event': EventDetailSerializer(event, context={'request': request}).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_images(self, request, pk=None):
        """
        Upload multiple images for an event

        Accepts multipart/form-data with 'image' field.
        Can upload multiple images at once.
        """
        event = self.get_object()

        serializer = ImageUploadSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create event image
        image = serializer.validated_data['image']
        order = serializer.validated_data.get('order', 0)

        event_image = EventImage.objects.create(
            event=event,
            image=image,
            order=order
        )

        invalidate_event_cache(event.id)

        logger.info(f"Image uploaded for event: {event.title}")

        return Response({
            'message': 'Image uploaded successfully.',
            'image': EventImageSerializer(event_image, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """
        Get event statistics

        Returns ticket sales, revenue, and other metrics.
        """
        event = self.get_object()

        stats = {
            'total_tickets_available': sum(
                tt.quantity_available for tt in event.ticket_types.all()
            ),
            'total_tickets_sold': sum(
                tt.quantity_sold for tt in event.ticket_types.all()
            ),
            'total_revenue': 0,  # Will be calculated from bookings in later sprints
            'ticket_types': [
                {
                    'name': tt.name,
                    'sold': tt.quantity_sold,
                    'available': tt.available_quantity,
                    'percentage_sold': (
                        (tt.quantity_sold / tt.quantity_available * 100)
                        if tt.quantity_available > 0 else 0
                    )
                }
                for tt in event.ticket_types.all()
            ],
            'is_sold_out': event.is_sold_out,
            'promo_codes_count': event.promo_codes.count(),
            'addons_count': event.addons.count(),
        }

        return Response(stats, status=status.HTTP_200_OK)


class TicketTypeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing ticket types within an event

    Nested under events:
    - POST /api/events/<event_id>/tickets/
    - GET /api/events/<event_id>/tickets/
    - PUT /api/events/<event_id>/tickets/<id>/
    - DELETE /api/events/<event_id>/tickets/<id>/
    """

    serializer_class = TicketTypeSerializer
    permission_classes = [IsAuthenticated, IsEventOrganizer]

    def get_queryset(self):
        """Get ticket types for the specified event"""
        event_id = self.kwargs.get('event_pk')
        return TicketType.objects.filter(
            event_id=event_id,
            event__organizer=self.request.user
        ).select_related('event')

    def perform_create(self, serializer):
        """Create ticket type for the specified event"""
        event_id = self.kwargs.get('event_pk')
        event = get_object_or_404(
            Event,
            id=event_id,
            organizer=self.request.user
        )

        ticket_type = serializer.save(event=event)
        invalidate_event_cache(event.id)

        logger.info(f"Ticket type created: {ticket_type.name} for event {event.title}")

    def perform_update(self, serializer):
        """Update ticket type and invalidate event cache"""
        ticket_type = serializer.save()
        invalidate_event_cache(ticket_type.event.id)

        logger.info(f"Ticket type updated: {ticket_type.name}")

    def perform_destroy(self, instance):
        """Delete ticket type and invalidate event cache"""
        event_id = instance.event.id
        instance.delete()
        invalidate_event_cache(event_id)

        logger.info(f"Ticket type deleted: {instance.name}")


class PromoCodeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing promo codes within an event

    Nested under events:
    - POST /api/events/<event_id>/promo-codes/
    - GET /api/events/<event_id>/promo-codes/
    - PUT /api/events/<event_id>/promo-codes/<id>/
    - DELETE /api/events/<event_id>/promo-codes/<id>/
    """

    serializer_class = PromoCodeSerializer
    permission_classes = [IsAuthenticated, IsEventOrganizer]

    def get_queryset(self):
        """Get promo codes for the specified event"""
        event_id = self.kwargs.get('event_pk')
        return PromoCode.objects.filter(
            event_id=event_id,
            event__organizer=self.request.user
        ).select_related('event')

    def perform_create(self, serializer):
        """Create promo code for the specified event"""
        event_id = self.kwargs.get('event_pk')
        event = get_object_or_404(
            Event,
            id=event_id,
            organizer=self.request.user
        )

        promo_code = serializer.save(event=event)
        logger.info(f"Promo code created: {promo_code.code} for event {event.title}")

    def perform_update(self, serializer):
        """Update promo code"""
        promo_code = serializer.save()
        logger.info(f"Promo code updated: {promo_code.code}")

    def perform_destroy(self, instance):
        """Delete promo code"""
        logger.info(f"Promo code deleted: {instance.code}")
        instance.delete()


class EventAddOnViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing event add-ons

    Nested under events:
    - POST /api/events/<event_id>/addons/
    - GET /api/events/<event_id>/addons/
    - PUT /api/events/<event_id>/addons/<id>/
    - DELETE /api/events/<event_id>/addons/<id>/
    """

    serializer_class = EventAddOnSerializer
    permission_classes = [IsAuthenticated, IsEventOrganizer]

    def get_queryset(self):
        """Get add-ons for the specified event"""
        event_id = self.kwargs.get('event_pk')
        return EventAddOn.objects.filter(
            event_id=event_id,
            event__organizer=self.request.user
        ).select_related('event')

    def perform_create(self, serializer):
        """Create add-on for the specified event"""
        event_id = self.kwargs.get('event_pk')
        event = get_object_or_404(
            Event,
            id=event_id,
            organizer=self.request.user
        )

        addon = serializer.save(event=event)
        logger.info(f"Add-on created: {addon.name} for event {event.title}")

    def perform_update(self, serializer):
        """Update add-on"""
        addon = serializer.save()
        logger.info(f"Add-on updated: {addon.name}")

    def perform_destroy(self, instance):
        """Delete add-on"""
        logger.info(f"Add-on deleted: {instance.name}")
        instance.delete()
