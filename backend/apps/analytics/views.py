"""
Analytics API views for organizers
"""

from rest_framework import generics, status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse, StreamingHttpResponse
from django.shortcuts import get_object_or_404
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from apps.events.models import Event
from apps.events.permissions import IsEventOrganizer
from .services import AnalyticsService
from .serializers import (
    EventOverviewSerializer,
    SalesTimelineSerializer,
    AttendeeDemographicsSerializer,
    OrganizerDashboardSerializer,
)


class EventOverviewAPIView(generics.GenericAPIView):
    """
    Get comprehensive event overview with analytics
    
    GET /api/analytics/events/<event_id>/overview/
    """
    
    permission_classes = [IsAuthenticated, IsEventOrganizer]
    serializer_class = EventOverviewSerializer
    
    def get(self, request, event_id):
        """Get event overview"""
        # Check permissions
        event = get_object_or_404(Event, id=event_id)
        self.check_object_permissions(request, event)
        
        # Get analytics data
        data = AnalyticsService.get_event_overview(event_id)
        
        if not data:
            return Response(
                {'error': 'Event not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.serializer_class(data)
        return Response(serializer.data)


class EventSalesTimelineAPIView(generics.GenericAPIView):
    """
    Get sales timeline for event
    
    GET /api/analytics/events/<event_id>/sales-timeline/?period=daily
    """
    
    permission_classes = [IsAuthenticated, IsEventOrganizer]
    serializer_class = SalesTimelineSerializer
    
    def get(self, request, event_id):
        """Get sales timeline"""
        # Check permissions
        event = get_object_or_404(Event, id=event_id)
        self.check_object_permissions(request, event)
        
        period = request.query_params.get('period', 'daily')
        
        if period not in ['hourly', 'daily', 'weekly']:
            return Response(
                {'error': 'Invalid period. Must be hourly, daily, or weekly'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get timeline data
        timeline = AnalyticsService.get_sales_timeline(event_id, period)
        
        serializer = self.serializer_class(timeline, many=True)
        return Response({
            'period': period,
            'data': serializer.data
        })


class EventAttendeeDemographicsAPIView(generics.GenericAPIView):
    """
    Get attendee demographics for event
    
    GET /api/analytics/events/<event_id>/demographics/
    """
    
    permission_classes = [IsAuthenticated, IsEventOrganizer]
    serializer_class = AttendeeDemographicsSerializer
    
    def get(self, request, event_id):
        """Get attendee demographics"""
        # Check permissions
        event = get_object_or_404(Event, id=event_id)
        self.check_object_permissions(request, event)
        
        # Get demographics data
        data = AnalyticsService.get_attendee_demographics(event_id)
        
        serializer = self.serializer_class(data)
        return Response(serializer.data)


class OrganizerDashboardAPIView(generics.GenericAPIView):
    """
    Get organizer dashboard metrics
    
    GET /api/analytics/dashboard/?period=30
    """
    
    permission_classes = [IsAuthenticated]
    serializer_class = OrganizerDashboardSerializer
    
    def get(self, request):
        """Get organizer dashboard"""
        # Only organizers can access
        if request.user.role != 'ORGANIZER':
            return Response(
                {'error': 'Only organizers can access this endpoint'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        period_days = int(request.query_params.get('period', 30))
        
        # Get dashboard data
        data = AnalyticsService.get_organizer_dashboard(
            str(request.user.id),
            period_days=period_days
        )
        
        serializer = self.serializer_class(data)
        return Response(serializer.data)


class ExportAttendeesCSVAPIView(generics.GenericAPIView):
    """
    Export event attendees to CSV

    GET /api/analytics/events/<event_id>/export/attendees/
    """

    permission_classes = [IsAuthenticated, IsEventOrganizer]

    @swagger_auto_schema(
        operation_description="Export event attendees as CSV file",
        responses={
            200: openapi.Response(
                description="CSV file download",
                schema=openapi.Schema(type=openapi.TYPE_FILE)
            )
        }
    )
    def get(self, request, event_id):
        """Export attendees CSV"""
        # Check permissions
        event = get_object_or_404(Event, id=event_id)
        self.check_object_permissions(request, event)
        
        # Generate CSV
        csv_buffer = AnalyticsService.export_event_attendees_csv(event_id)
        
        # Create response
        response = HttpResponse(csv_buffer.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="attendees_{event.slug}.csv"'
        
        return response


class ExportSalesCSVAPIView(generics.GenericAPIView):
    """
    Export event sales to CSV

    GET /api/analytics/events/<event_id>/export/sales/
    """

    permission_classes = [IsAuthenticated, IsEventOrganizer]

    @swagger_auto_schema(
        operation_description="Export event sales as CSV file",
        responses={
            200: openapi.Response(
                description="CSV file download",
                schema=openapi.Schema(type=openapi.TYPE_FILE)
            )
        }
    )
    def get(self, request, event_id):
        """Export sales CSV"""
        # Check permissions
        event = get_object_or_404(Event, id=event_id)
        self.check_object_permissions(request, event)
        
        # Generate CSV
        csv_buffer = AnalyticsService.export_event_sales_csv(event_id)
        
        # Create response
        response = HttpResponse(csv_buffer.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="sales_{event.slug}.csv"'
        
        return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def quick_stats(request):
    """
    Get quick stats for organizer
    
    GET /api/analytics/quick-stats/
    """
    if request.user.role != 'ORGANIZER':
        return Response(
            {'error': 'Only organizers can access this endpoint'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    from apps.events.models import Event
    from apps.bookings.models import Booking, Ticket
    from django.utils import timezone
    from django.db.models import Sum
    
    # Get organizer's events
    events = Event.objects.filter(organizer=request.user)
    
    # Active events (upcoming and published)
    active_events = events.filter(
        status=Event.PUBLISHED,
        start_datetime__gte=timezone.now()
    ).count()
    
    # Total bookings for all events
    total_bookings = Booking.objects.filter(
        event__organizer=request.user,
        status=Booking.STATUS_CONFIRMED
    ).count()
    
    # Total tickets sold
    total_tickets = Ticket.objects.filter(
        booking__event__organizer=request.user
    ).count()
    
    # Total revenue
    total_revenue = Booking.objects.filter(
        event__organizer=request.user,
        status=Booking.STATUS_CONFIRMED
    ).aggregate(total=Sum('final_amount'))['total'] or 0
    
    # This month's revenue
    from datetime import datetime
    first_day_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_revenue = Booking.objects.filter(
        event__organizer=request.user,
        status=Booking.STATUS_CONFIRMED,
        created_at__gte=first_day_of_month
    ).aggregate(total=Sum('final_amount'))['total'] or 0
    
    return Response({
        'total_events': events.count(),
        'active_events': active_events,
        'total_bookings': total_bookings,
        'total_tickets': total_tickets,
        'total_revenue': float(total_revenue),
        'month_revenue': float(month_revenue),
    })
