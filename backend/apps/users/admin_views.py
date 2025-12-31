"""
Admin-specific views for user management
"""

from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.db.models import Q, Count, Sum
from django.utils import timezone
from .models import Attendee
from .serializers import (
    AdminOrganizerListSerializer,
    AdminOrganizerDetailSerializer,
    AdminAttendeeListSerializer,
    AdminAttendeeDetailSerializer,
    AdminUpdateAttendeeSerializer,
    OrganizerApprovalSerializer,
    AdminUpdateOrganizerSerializer,
    AdminDashboardSerializer,
    AdminAnalyticsSerializer
)
from apps.events.models import Event
from apps.bookings.models import Booking
from .permissions import IsAdmin
from .services import EmailService
import logging

logger = logging.getLogger(__name__)

User = get_user_model()


class AdminOrganizerListView(generics.ListAPIView):
    """
    GET /api/admin/organizers/
    List all organizers (admin only)
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        """
        Get organizers list with optional filtering
        """
        queryset = User.objects.filter(role=User.ORGANIZER).order_by('-created_at')

        # Filter by verification status
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(verification_status=status.upper())

        # Filter by email verified
        email_verified = self.request.query_params.get('email_verified', None)
        if email_verified is not None:
            verified = email_verified.lower() == 'true'
            queryset = queryset.filter(email_verified=verified)

        # Search by email or company name
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) | Q(company_name__icontains=search)
            )

        return queryset

    def get_serializer_class(self):
        return AdminOrganizerListSerializer

    def list(self, request, *args, **kwargs):
        """
        Override list to return organizers in the format expected by the frontend
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)

        # Transform the data to match the expected frontend format
        organizers_data = []
        for item in serializer.data:
            organizer_data = {
                'id': item['id'],
                'email': item['email'],
                'company_name': item['company_name'],
                'phone_number': item['phone_number'],
                'verification_status': item['verification_status'],
                'verification_documents': item.get('verification_documents', []),
                'created_at': item['created_at'],
                'updated_at': item['updated_at'],
            }
            organizers_data.append(organizer_data)

        return Response(organizers_data)


class AdminOrganizerDetailView(generics.RetrieveUpdateAPIView):
    """
    GET/PATCH /api/admin/organizers/<id>/
    Get or update organizer details (admin only)
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        """
        Get organizer with events
        """
        from apps.events.models import Event
        return User.objects.filter(
            role=User.ORGANIZER
        ).prefetch_related(
            'events'
        )

    def get_serializer_class(self):
        if self.request.method == 'PATCH':
            return AdminUpdateOrganizerSerializer
        return AdminOrganizerDetailSerializer

    def retrieve(self, request, *args, **kwargs):
        """
        Override retrieve to include events data
        """
        instance = self.get_object()

        # Serialize organizer details
        organizer_serializer = self.get_serializer(instance)

        # Get events for this organizer
        from apps.events.models import Event
        from apps.events.serializers import EventListSerializer
        events = Event.objects.filter(organizer=instance)
        events_serializer = EventListSerializer(events, many=True, context={'request': request})

        # Combine data
        data = organizer_serializer.data
        data['events'] = events_serializer.data

        return Response(data)


class OrganizerApprovalView(generics.GenericAPIView):
    """
    POST /api/admin/organizers/<id>/approve-reject/
    Approve or reject organizer application (admin only)
    """
    serializer_class = OrganizerApprovalSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = User.objects.filter(role=User.ORGANIZER)

    def post(self, request, pk):
        user = generics.get_object_or_404(User, pk=pk, role=User.ORGANIZER)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = serializer.validated_data['action']
        reason = serializer.validated_data.get('reason', None)

        if action == 'approve':
            user.verification_status = User.APPROVED
            user.save()

            # Send approval email
            EmailService.send_approval_email(user)

            logger.info(f"Organizer {user.email} approved by admin {request.user.email}")

            return Response({
                'message': 'Organizer approved successfully.',
                'user': AdminOrganizerDetailSerializer(user).data
            }, status=status.HTTP_200_OK)

        elif action == 'reject':
            user.verification_status = User.REJECTED
            user.save()

            # Send rejection email with reason
            EmailService.send_rejection_email(user, reason)

            logger.info(f"Organizer {user.email} rejected by admin {request.user.email}. Reason: {reason}")

            return Response({
                'message': 'Organizer rejected.',
                'user': AdminOrganizerDetailSerializer(user).data
            }, status=status.HTTP_200_OK)


class AdminDashboardView(generics.GenericAPIView):
    """
    GET /api/admin/dashboard/
    Get admin dashboard statistics
    """
    serializer_class = AdminDashboardSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = []  # Disable filters for this view

    def get(self, request):
        # Get organizer statistics
        total_organizers = User.objects.filter(role=User.ORGANIZER).count()
        pending_organizers = User.objects.filter(
            role=User.ORGANIZER,
            verification_status=User.PENDING
        ).count()
        approved_organizers = User.objects.filter(
            role=User.ORGANIZER,
            verification_status=User.APPROVED
        ).count()
        rejected_organizers = User.objects.filter(
            role=User.ORGANIZER,
            verification_status=User.REJECTED
        ).count()

        # Get event statistics
        total_events = Event.objects.count()
        published_events = Event.objects.filter(status=Event.PUBLISHED).count()
        upcoming_events = Event.objects.filter(
            status=Event.PUBLISHED,
            start_datetime__gte=timezone.now()
        ).count()

        # Get booking and revenue statistics
        from django.db.models import Sum
        total_revenue = Booking.objects.filter(
            status=Booking.STATUS_CONFIRMED
        ).aggregate(total=Sum('final_amount'))['total'] or 0
        total_bookings = Booking.objects.filter(
            status=Booking.STATUS_CONFIRMED
        ).count()
        total_tickets_sold = Booking.objects.filter(
            status=Booking.STATUS_CONFIRMED
        ).aggregate(total=Sum('items__quantity'))['total'] or 0

        # Return data in the format expected by the frontend
        dashboard_data = {
            'total_organizers': total_organizers,
            'pending_organizers': pending_organizers,
            'total_events': total_events,
            'total_revenue': float(total_revenue),
        }

        return Response(dashboard_data, status=status.HTTP_200_OK)


class AdminAnalyticsView(generics.GenericAPIView):
    """
    GET /api/admin/analytics/
    Get admin analytics and reports
    """
    serializer_class = AdminAnalyticsSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = []  # Disable filters for this view

    def get(self, request):
        from datetime import timedelta
        from django.utils import timezone
        from django.db.models import Sum

        # Get organizer statistics
        total_organizers = User.objects.filter(role=User.ORGANIZER).count()

        # Get event statistics
        total_events = Event.objects.count()

        # Get booking and revenue statistics
        total_revenue = Booking.objects.filter(
            status=Booking.STATUS_CONFIRMED
        ).aggregate(total=Sum('final_amount'))['total'] or 0
        total_tickets_sold = Booking.objects.filter(
            status=Booking.STATUS_CONFIRMED
        ).aggregate(total=Sum('items__quantity'))['total'] or 0

        # Return data in the format expected by the frontend
        analytics_data = {
            'total_organizers': total_organizers,
            'total_events': total_events,
            'total_revenue': float(total_revenue),
            'total_tickets_sold': total_tickets_sold or 0,
        }

        return Response(analytics_data, status=status.HTTP_200_OK)


class AdminAttendeeListView(generics.ListAPIView):
    """
    GET /api/admin/attendees/
    List all attendees (admin only)
    """
    serializer_class = AdminAttendeeListSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        """
        Get attendees list with optional filtering
        """
        queryset = Attendee.objects.all().order_by('-created_at')

        # Filter by subscription status
        is_subscribed = self.request.query_params.get('is_subscribed', None)
        if is_subscribed is not None:
            subscribed = is_subscribed.lower() == 'true'
            queryset = queryset.filter(is_subscribed=subscribed)

        # Filter by email verification
        email_verified = self.request.query_params.get('email_verified', None)
        if email_verified is not None:
            verified = email_verified.lower() == 'true'
            queryset = queryset.filter(email_verified=verified)

        # Search by email or name
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )

        return queryset


class AdminAttendeeDetailView(generics.RetrieveUpdateAPIView):
    """
    GET/PATCH /api/admin/attendees/<id>/
    Get or update attendee details (admin only)
    """
    queryset = Attendee.objects.all()
    serializer_class = AdminAttendeeDetailSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_serializer_class(self):
        if self.request.method == 'PATCH':
            return AdminUpdateAttendeeSerializer
        return AdminAttendeeDetailSerializer


class AdminEventsListView(generics.ListAPIView):
    """
    GET /api/admin/events/
    List all events with analytics data (admin only)
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        """
        Get all events with analytics data
        """
        from django.db.models import Count, Sum, Q

        queryset = Event.objects.all().select_related(
            'organizer'
        ).prefetch_related(
            'ticket_types'
        ).annotate(
            total_bookings=Count(
                'bookings',
                filter=Q(bookings__status=Booking.STATUS_CONFIRMED)
            ),
            total_revenue=Sum(
                'bookings__final_amount',
                filter=Q(bookings__status=Booking.STATUS_CONFIRMED)
            )
        ).order_by('-created_at')

        # Filter by event status
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status.upper())

        # Filter by organizer
        organizer_id = self.request.query_params.get('organizer', None)
        if organizer_id:
            queryset = queryset.filter(organizer_id=organizer_id)

        # Search by title or venue
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(venue_name__icontains=search)
            )

        return queryset

    def get_serializer_class(self):
        from apps.events.serializers import EventListSerializer
        return EventListSerializer

    def list(self, request, *args, **kwargs):
        """
        Override list to return events with additional analytics data
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)

        # Calculate platform-wide event statistics
        total_events = Event.objects.count()
        published_events = Event.objects.filter(status=Event.PUBLISHED).count()
        upcoming_events = Event.objects.filter(
            status=Event.PUBLISHED,
            start_datetime__gte=timezone.now()
        ).count()
        total_revenue = Booking.objects.filter(
            status=Booking.STATUS_CONFIRMED
        ).aggregate(total=Sum('final_amount'))['total'] or 0
        total_bookings = Booking.objects.filter(
            status=Booking.STATUS_CONFIRMED
        ).count()

        return Response({
            'count': queryset.count(),
            'results': serializer.data,
            'analytics': {
                'total_events': total_events,
                'published_events': published_events,
                'upcoming_events': upcoming_events,
                'total_revenue': float(total_revenue),
                'total_bookings': total_bookings
            }
        })
