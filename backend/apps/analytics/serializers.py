"""
Serializers for analytics data
"""

from rest_framework import serializers
from .models import EventAnalytics, OrganizerAnalytics


class EventAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for event analytics model"""
    
    event_title = serializers.CharField(source='event.title', read_only=True)
    
    class Meta:
        model = EventAnalytics
        fields = [
            'id',
            'event',
            'event_title',
            'date',
            'total_bookings',
            'confirmed_bookings',
            'cancelled_bookings',
            'total_tickets_sold',
            'total_tickets_checked_in',
            'gross_revenue',
            'net_revenue',
            'discounts_given',
            'mpesa_revenue',
            'card_revenue',
            'ticket_type_sales',
            'promo_codes_used',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class OrganizerAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for organizer analytics model"""
    
    organizer_name = serializers.CharField(source='organizer.company_name', read_only=True)
    
    class Meta:
        model = OrganizerAnalytics
        fields = [
            'id',
            'organizer',
            'organizer_name',
            'month',
            'total_events',
            'active_events',
            'completed_events',
            'cancelled_events',
            'total_bookings',
            'total_tickets_sold',
            'total_revenue',
            'avg_ticket_price',
            'avg_tickets_per_event',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class EventOverviewSerializer(serializers.Serializer):
    """Serializer for event overview data"""
    
    event_id = serializers.UUIDField()
    event_title = serializers.CharField()
    event_status = serializers.CharField()
    start_datetime = serializers.DateTimeField()
    
    # Booking metrics
    total_bookings = serializers.IntegerField()
    confirmed_bookings = serializers.IntegerField()
    pending_bookings = serializers.IntegerField()
    cancelled_bookings = serializers.IntegerField()
    
    # Ticket metrics
    total_tickets = serializers.IntegerField()
    tickets_checked_in = serializers.IntegerField()
    check_in_rate = serializers.FloatField()
    
    # Revenue metrics
    gross_revenue = serializers.FloatField()
    net_revenue = serializers.FloatField()
    total_revenue = serializers.FloatField()
    total_discounts = serializers.FloatField()

    # Frontend-compatible fields
    total_attendees = serializers.IntegerField()
    tickets_sold = serializers.IntegerField()

    # Payment methods
    mpesa_revenue = serializers.FloatField()
    card_revenue = serializers.FloatField()

    # Breakdowns
    ticket_types = serializers.JSONField()
    ticket_type_breakdown = serializers.JSONField()
    promo_codes = serializers.JSONField()
    
    # Capacity metrics
    capacity = serializers.IntegerField(allow_null=True)
    tickets_available = serializers.IntegerField(allow_null=True)
    capacity_used_percent = serializers.FloatField()


class SalesTimelineSerializer(serializers.Serializer):
    """Serializer for sales timeline data"""
    
    date = serializers.DateField()
    bookings = serializers.IntegerField()
    tickets = serializers.IntegerField()
    revenue = serializers.FloatField()


class AttendeeDemographicsSerializer(serializers.Serializer):
    """Serializer for attendee demographics"""
    
    total_attendees = serializers.IntegerField()
    unique_emails = serializers.IntegerField()
    repeat_customers = serializers.IntegerField()
    top_email_domains = serializers.JSONField()
    booking_hours_distribution = serializers.ListField()
    avg_tickets_per_booking = serializers.FloatField()


class OrganizerDashboardSerializer(serializers.Serializer):
    """Serializer for organizer dashboard data"""

    class Meta:
        ref_name = 'AnalyticsOrganizerDashboard'

    organizer_id = serializers.UUIDField()
    organizer_name = serializers.CharField()
    period_days = serializers.IntegerField()

    # Event metrics
    total_events = serializers.IntegerField()
    active_events = serializers.IntegerField()
    upcoming_events_count = serializers.IntegerField()
    draft_events = serializers.IntegerField()
    completed_events = serializers.IntegerField()

    # Frontend-compatible fields
    total_bookings = serializers.IntegerField()
    tickets_sold = serializers.IntegerField()
    total_revenue = serializers.FloatField()
    total_attendees = serializers.IntegerField()

    # Legacy fields (for backward compatibility)
    lifetime_bookings = serializers.IntegerField()
    lifetime_tickets = serializers.IntegerField()
    lifetime_revenue = serializers.FloatField()

    # Period metrics
    period_bookings = serializers.IntegerField()
    period_tickets = serializers.IntegerField()
    period_revenue = serializers.FloatField()

    # Averages
    avg_revenue_per_event = serializers.FloatField()
    avg_tickets_per_event = serializers.FloatField()
