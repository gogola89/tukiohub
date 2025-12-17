"""
URL configuration for events app
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers

from .views import (
    EventViewSet,
    TicketTypeViewSet,
    PromoCodeViewSet,
    EventAddOnViewSet
)
from .public_views import (
    PublicEventViewSet,
    FeaturedEventsAPIView,
    EventCategoriesAPIView,
    EventSearchAPIView,
    NearbyEventsAPIView,
    EventsByCategoryAPIView
)

app_name = 'events'

# Organizer router for managing events
organizer_router = DefaultRouter()
organizer_router.register(r'events', EventViewSet, basename='event')

# Nested routers for event-related resources
events_router = routers.NestedDefaultRouter(
    organizer_router,
    r'events',
    lookup='event'
)
events_router.register(r'tickets', TicketTypeViewSet, basename='event-tickets')
events_router.register(r'promo-codes', PromoCodeViewSet, basename='event-promo-codes')
events_router.register(r'addons', EventAddOnViewSet, basename='event-addons')

# Public router for browsing events
public_router = DefaultRouter()
public_router.register(r'events', PublicEventViewSet, basename='public-event')

urlpatterns = [
    # Public routes (no authentication required) - must come BEFORE router URLs
    path('public/events/featured/', FeaturedEventsAPIView.as_view(), name='featured-events'),
    path('public/events/categories/', EventCategoriesAPIView.as_view(), name='event-categories'),
    path('public/events/search/', EventSearchAPIView.as_view(), name='event-search'),
    path('public/events/nearby/', NearbyEventsAPIView.as_view(), name='nearby-events'),
    path('public/events/category/<str:category>/', EventsByCategoryAPIView.as_view(), name='events-by-category'),
    path('public/', include(public_router.urls)),

    # Organizer routes (authenticated)
    path('', include(organizer_router.urls)),
    path('', include(events_router.urls)),
]
