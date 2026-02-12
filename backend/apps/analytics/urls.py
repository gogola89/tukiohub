"""
URL routing for analytics app
"""

from django.urls import path
from .views import (
    EventOverviewAPIView,
    EventSalesTimelineAPIView,
    EventAttendeeDemographicsAPIView,
    OrganizerDashboardAPIView,
    ExportAttendeesCSVAPIView,
    ExportSalesCSVAPIView,
    quick_stats,
    aggregate_sales_timeline,
    aggregate_ticket_breakdown,
)

app_name = 'analytics'

urlpatterns = [
    # Organizer dashboard
    path('dashboard/', OrganizerDashboardAPIView.as_view(), name='organizer-dashboard'),
    path('quick-stats/', quick_stats, name='quick-stats'),

    # Aggregate analytics (across all organizer events)
    path('aggregate/sales-timeline/', aggregate_sales_timeline, name='aggregate-sales-timeline'),
    path('aggregate/ticket-breakdown/', aggregate_ticket_breakdown, name='aggregate-ticket-breakdown'),

    # Event analytics
    path('events/<uuid:event_id>/overview/', EventOverviewAPIView.as_view(), name='event-overview'),
    path('events/<uuid:event_id>/sales-timeline/', EventSalesTimelineAPIView.as_view(), name='sales-timeline'),
    path('events/<uuid:event_id>/demographics/', EventAttendeeDemographicsAPIView.as_view(), name='demographics'),

    # Exports
    path('events/<uuid:event_id>/export/attendees/', ExportAttendeesCSVAPIView.as_view(), name='export-attendees'),
    path('events/<uuid:event_id>/export/sales/', ExportSalesCSVAPIView.as_view(), name='export-sales'),
]
