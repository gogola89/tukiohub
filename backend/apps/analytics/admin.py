"""
Django admin for analytics app
"""

from django.contrib import admin
from .models import EventAnalytics, OrganizerAnalytics


@admin.register(EventAnalytics)
class EventAnalyticsAdmin(admin.ModelAdmin):
    """Admin interface for event analytics"""
    
    list_display = [
        'event',
        'date',
        'total_bookings',
        'confirmed_bookings',
        'total_tickets_sold',
        'tickets_checked_in',
        'net_revenue',
    ]
    
    list_filter = [
        'date',
        'event__category',
    ]
    
    search_fields = [
        'event__title',
    ]
    
    readonly_fields = [
        'event',
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
    
    def tickets_checked_in(self, obj):
        """Display check-in rate"""
        if obj.total_tickets_sold > 0:
            rate = (obj.total_tickets_checked_in / obj.total_tickets_sold) * 100
            return f"{obj.total_tickets_checked_in} ({rate:.1f}%)"
        return "0"
    tickets_checked_in.short_description = "Checked In"
    
    def has_add_permission(self, request):
        """Disable manual creation"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Disable deletion"""
        return False


@admin.register(OrganizerAnalytics)
class OrganizerAnalyticsAdmin(admin.ModelAdmin):
    """Admin interface for organizer analytics"""
    
    list_display = [
        'organizer',
        'month',
        'total_events',
        'active_events',
        'total_bookings',
        'total_tickets_sold',
        'total_revenue',
    ]
    
    list_filter = [
        'month',
    ]
    
    search_fields = [
        'organizer__email',
        'organizer__company_name',
    ]
    
    readonly_fields = [
        'organizer',
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
    
    def has_add_permission(self, request):
        """Disable manual creation"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Disable deletion"""
        return False
