"""
URL routing for analytics app
"""

from django.urls import path
from .views import (
    EventOverviewAPIView,
    EventSalesTimelineAPIView,
    EventAttendeeDemographicsAPIView,
    EventReconciliationReportAPIView,
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
    # Note: deliberately "for-event" rather than "events" here - ad-blockers
    # and browser tracking protection commonly block URLs matching
    # analytics/events/* patterns (that's the exact shape most third-party
    # analytics SDKs use for their tracking beacons), which silently killed
    # these first-party endpoints client-side with no server-visible error.
    path('for-event/<uuid:event_id>/overview/', EventOverviewAPIView.as_view(), name='event-overview'),
    path('for-event/<uuid:event_id>/sales-timeline/', EventSalesTimelineAPIView.as_view(), name='sales-timeline'),
    path('for-event/<uuid:event_id>/demographics/', EventAttendeeDemographicsAPIView.as_view(), name='demographics'),
    path('for-event/<uuid:event_id>/reconciliation/', EventReconciliationReportAPIView.as_view(), name='reconciliation'),

    # Exports
    path('for-event/<uuid:event_id>/export/attendees/', ExportAttendeesCSVAPIView.as_view(), name='export-attendees'),
    path('for-event/<uuid:event_id>/export/sales/', ExportSalesCSVAPIView.as_view(), name='export-sales'),
]
