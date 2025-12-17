"""
Filters for events app
"""

import django_filters
from django.db.models import Q, Min, Max
from .models import Event


class EventFilter(django_filters.FilterSet):
    """
    Filter for event list with advanced filtering options
    """

    # Category filter
    category = django_filters.ChoiceFilter(
        choices=Event.CATEGORY_CHOICES,
        field_name='category',
        lookup_expr='exact'
    )

    # Search filter (title, description, venue)
    search = django_filters.CharFilter(method='filter_search')

    # Date range filters
    start_date = django_filters.DateTimeFilter(
        field_name='start_datetime',
        lookup_expr='gte'
    )
    end_date = django_filters.DateTimeFilter(
        field_name='end_datetime',
        lookup_expr='lte'
    )

    # Price range filters (based on ticket types)
    min_price = django_filters.NumberFilter(method='filter_min_price')
    max_price = django_filters.NumberFilter(method='filter_max_price')

    # Free events filter
    is_free = django_filters.BooleanFilter(field_name='is_free')

    # Status filter
    status = django_filters.ChoiceFilter(
        choices=Event.STATUS_CHOICES,
        field_name='status',
        lookup_expr='exact'
    )

    # Location filter (city/venue)
    location = django_filters.CharFilter(method='filter_location')

    # Upcoming events only
    upcoming = django_filters.BooleanFilter(method='filter_upcoming')

    # Featured/sold out filters
    sold_out = django_filters.BooleanFilter(method='filter_sold_out')

    # Organizer filter
    organizer = django_filters.UUIDFilter(field_name='organizer__id')

    class Meta:
        model = Event
        fields = [
            'category', 'is_free', 'status', 'organizer',
            'search', 'start_date', 'end_date',
            'min_price', 'max_price', 'location', 'upcoming', 'sold_out'
        ]

    def filter_search(self, queryset, name, value):
        """
        Search across multiple fields (title, description, venue, tags)
        """
        return queryset.filter(
            Q(title__icontains=value) |
            Q(description__icontains=value) |
            Q(venue_name__icontains=value) |
            Q(venue_address__icontains=value) |
            Q(tags__contains=[value])
        )

    def filter_location(self, queryset, name, value):
        """
        Filter by location (venue name or address)
        """
        return queryset.filter(
            Q(venue_name__icontains=value) |
            Q(venue_address__icontains=value)
        )

    def filter_min_price(self, queryset, name, value):
        """
        Filter events with minimum ticket price greater than or equal to value
        """
        # Get events with ticket types having price >= value
        event_ids = []
        for event in queryset:
            if event.min_price >= value:
                event_ids.append(event.id)

        return queryset.filter(id__in=event_ids)

    def filter_max_price(self, queryset, name, value):
        """
        Filter events with maximum ticket price less than or equal to value
        """
        # Get events with ticket types having price <= value
        event_ids = []
        for event in queryset:
            if event.max_price <= value:
                event_ids.append(event.id)

        return queryset.filter(id__in=event_ids)

    def filter_upcoming(self, queryset, name, value):
        """
        Filter upcoming events only
        """
        from django.utils import timezone

        if value:
            return queryset.filter(start_datetime__gte=timezone.now())
        return queryset

    def filter_sold_out(self, queryset, name, value):
        """
        Filter sold out or available events
        """
        # This is a simplified implementation
        # In production, you'd want to optimize this with annotations
        event_ids = []
        for event in queryset:
            if event.is_sold_out == value:
                event_ids.append(event.id)

        return queryset.filter(id__in=event_ids)


class OrganizerEventFilter(django_filters.FilterSet):
    """
    Filter for organizer's own events
    """

    # Status filter
    status = django_filters.ChoiceFilter(
        choices=Event.STATUS_CHOICES,
        field_name='status',
        lookup_expr='exact'
    )

    # Category filter
    category = django_filters.ChoiceFilter(
        choices=Event.CATEGORY_CHOICES,
        field_name='category',
        lookup_expr='exact'
    )

    # Search filter
    search = django_filters.CharFilter(method='filter_search')

    # Date range filters
    start_date = django_filters.DateTimeFilter(
        field_name='start_datetime',
        lookup_expr='gte'
    )
    end_date = django_filters.DateTimeFilter(
        field_name='end_datetime',
        lookup_expr='lte'
    )

    # Past/upcoming filter
    upcoming = django_filters.BooleanFilter(method='filter_upcoming')
    past = django_filters.BooleanFilter(method='filter_past')

    class Meta:
        model = Event
        fields = ['status', 'category', 'search', 'start_date', 'end_date', 'upcoming', 'past']

    def filter_search(self, queryset, name, value):
        """Search across title, description, venue"""
        return queryset.filter(
            Q(title__icontains=value) |
            Q(description__icontains=value) |
            Q(venue_name__icontains=value)
        )

    def filter_upcoming(self, queryset, name, value):
        """Filter upcoming events"""
        from django.utils import timezone

        if value:
            return queryset.filter(start_datetime__gte=timezone.now())
        return queryset

    def filter_past(self, queryset, name, value):
        """Filter past events"""
        from django.utils import timezone

        if value:
            return queryset.filter(end_datetime__lt=timezone.now())
        return queryset
